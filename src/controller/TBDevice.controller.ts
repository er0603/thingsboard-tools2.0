/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express';
import checkStatusError from '../helpers/checkStatusError';
import { createDevices, deleteDevices, getDevices } from '../service/device';
import CreateTBDeviceReqDTO from '../interface/serviceRequest/device/createTBDevicesDTO';
import DeleteTBDeviceReqDTO from '../interface/serviceRequest/device/deleteTBDeviceDTO';
import WinstonLogger from '../helpers/loggers';
import SetTBDeviceActionReqDTO from '../interface/serviceRequest/device/setTBDeviceActionDTO';
import { setDeviceAction, getAllDeviceAction } from '../service/device/setDeviceAction';
import Mock from '../library/mockData';
import SetTBDeviceMockDataDTO from '../interface/serviceRequest/device/setTBDeviceMockDataDTO';
import { createMockDataEntity } from '../service/device/mockData';

const loggers = new WinstonLogger({ type: 'Device controller' });

export async function createTBDevices(req: Request, res: Response, next: NextFunction) {
    try {
        const { body } = req;
        const { deviceCount, ...profile } = new CreateTBDeviceReqDTO(body);
        const response = await createDevices(req.headers.TBTenantToken as string, deviceCount, profile);
        if (checkStatusError(response)) {
            return next({
                status: response.status,
                errorMessage: response.errorMessage,
            });
        }
        loggers.debug(response);
        return res.status(response.status).json(response.list);
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}

export async function deleteTBDevices(req: Request, res: Response, next: NextFunction) {
    try {
        const { body } = req;
        const { deviceList } = new DeleteTBDeviceReqDTO(body);
        const response = await deleteDevices(req.headers.TBTenantToken as string, deviceList);

        if (checkStatusError(response)) {
            return next({
                status: response.status,
                errorMessage: response.errorMessage,
            });
        }
        loggers.debug(response);
        return res.status(response.status).end();
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}

export async function getTBDevices(req: Request, res: Response, next: NextFunction) {
    try {
        const response = await getDevices(req.headers.TBTenantToken as string);
        if (checkStatusError(response)) {
            return next({
                status: response.status,
                errorMessage: response.errorMessage,
            });
        }
        loggers.debug(response);
        return res.status(response.status).json(response);
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}

export async function setTBDeviceAction(req: Request, res: Response, next: NextFunction) {
    try {
        const { body } = req;
        const { deviceList } = new SetTBDeviceActionReqDTO(body);
        await setDeviceAction(deviceList);
        return res.status(200).json(getAllDeviceAction());
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}

export async function setMockDataEntity(req: Request, res: Response, next: NextFunction) {
    try {
        const { body } = req;
        const config = new SetTBDeviceMockDataDTO(body);
        const entity = createMockDataEntity(config);
        if (checkStatusError(entity)) return next(entity);
        return res.status(entity.status).json(entity);
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}

export async function getMockDataEntity(_req: Request, res: Response, next: NextFunction) {
    try {
        const entity = Mock.getNameList();
        return res.status(200).json({ list: entity });
    } catch (error) {
        return next({
            status: 500,
            errorMessage: 'Internal Server Error',
        });
    }
}
