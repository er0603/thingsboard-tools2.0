import env from '../../constants/env';
import * as TBUserConnecter from '../../application/thingsboardConnecter/user';
import WinstonLogger, { simpleMsg } from '../../helpers/loggers';
import checkAxiosError from '../../helpers/checkAxiosError';
import { SearchTenantAdminRes, SearchTenantRes } from '../../types/user';
import checkTenantAdminOrTenantExist from './checkTenantAdminOrTenantExist';
import createTenantAdmin from './createTenantAdmin';
import createTenant from './createTenant';

const loggers = new WinstonLogger({ type: 'User component' });
const { tenantAdminName, tenantEmail } = env.TB_User;
const {
    loginSystemAdminToken,
    searchTenantAdmin,
    searchTenant,
    loginTenant,
} = TBUserConnecter;

async function getSystemAdminToken() {
    loggers.debug('Try to get admin token', 'Login system admin');
    const response = await loginSystemAdminToken();
    if (checkAxiosError(response)) {
        return '';
    }
    return response.token;
}

async function getTenantAdminId(token: string, tenantAdminsInfo:SearchTenantAdminRes) {
    let tenantAdminId;
    if (checkTenantAdminOrTenantExist(tenantAdminsInfo)) {
        const firstTenantAdminId = tenantAdminsInfo.data[0].id.id;
        tenantAdminId = firstTenantAdminId;
    } else {
        loggers.warning('Tenant admin is not exist, try to create new tenant admin', 'Check Tenant admin');
        tenantAdminId = await createTenantAdmin(token);
    }
    loggers.debug({ tenantAdminId }, 'Get tenant admin id success');
    return tenantAdminId;
}

async function getTenantId(token: string, tenantInfo:SearchTenantRes, tenantAdminId: string) {
    let tenantId;
    if (checkTenantAdminOrTenantExist(tenantInfo)) {
        const firstTenantId = tenantInfo.data[0].id.id;
        tenantId = firstTenantId;
    } else {
        loggers.warning('Tenant is not exist, try to create new tenant', 'Check Tenant');
        tenantId = await createTenant(token, tenantAdminId);
    }
    loggers.debug({ tenantId }, 'Get tenant id success');
    return tenantId;
}

async function getTenantToken(adminToken: string, tenantId: string) {
    const tenantInfo = await loginTenant(adminToken, tenantId);
    if (checkAxiosError(tenantInfo)) return '';
    const tenantToken = tenantInfo.token;
    simpleMsg(`Get tenant token success: ${tenantToken}`);
    return tenantToken;
}

export default async function tryGetTenantToken() {
    const adminToken = await getSystemAdminToken();

    // 1. 檢查Tenant admin是否存在並取得id
    // eslint-disable-next-line max-len
    const tenantAdminsInfo = await searchTenantAdmin(adminToken, tenantAdminName);
    if (checkAxiosError(tenantAdminsInfo)) return '';

    // 2. 檢查Tenant是否存在並取得Tenant id
    const tenantAdminId = await getTenantAdminId(adminToken, tenantAdminsInfo);
    const searchTenantInfo = await searchTenant(
        adminToken,
        tenantAdminId,
        tenantEmail,
    );
    const tenantId = await getTenantId(adminToken, searchTenantInfo, tenantAdminId);

    // 3. 取得Tenant token
    const tenantToken = getTenantToken(adminToken, tenantId);

    return tenantToken;
}
