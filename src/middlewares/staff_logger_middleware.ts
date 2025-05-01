

import { Request, Response, NextFunction } from 'express';
import { StaffOperation } from '../models/staff_operation_model';
import { User } from '../models/user_model';
import { IStaffOperation } from '../models/staff_operation_model';

const routeOperationMap: Record<string, 'create' | 'update' | 'delete' | 'block' | 'unblock'> = {
    'POST /staff': 'create',
    'PUT /staff/:staffId': 'update',
    'DELETE /staff/:staffId': 'delete',
    'POST /staff/:staffId/block': 'block',
    'POST /staff/:staffId/unblock': 'unblock'
};

function detectChanges(oldData: any, newData: any): { field: string; oldValue?: any; newValue?: any }[] {
    const changes: { field: string; oldValue?: any; newValue?: any }[] = [];

    if (newData.name && newData.name !== oldData.name) {
        changes.push({ field: 'name', oldValue: oldData.name, newValue: newData.name });
    }

    if (newData.email && newData.email !== oldData.email) {
        changes.push({ field: 'email', oldValue: oldData.email, newValue: newData.email });
    }

    if (newData.password) {
        changes.push({ field: 'password', newValue: 'updated' });
    }

    return changes;
}

export const staffOperationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const routeKey = `${req.method} ${req.baseUrl}${req.route?.path || ''}`;
    // const operationType = routeOperationMap[routeKey];
    const operationType = req.method;

    if (!operationType) return next();

    const editorId = res.locals.user?._id;
    const subCompanyId = res.locals.user?.subCompanyId;
    const { staffId } = req.params;
    const targetUserId = staffId || req.body.staffId;

    if (!staffId || !subCompanyId || !targetUserId) return next();

    const originalUser = await User.findById(targetUserId).lean();
    if (!originalUser) return next();

    const originalJson = res.json;

    res.json = function (body) {
        const result = originalJson.call(this, body);
        console.log("Result",result);

        (async () => {
            try {
                const updatedUser = await User.findById(targetUserId).lean();
                let changes: IStaffOperation['changes'] = [];
                 console.log("operationType",operationType);

                switch (operationType) {
                    case 'PUT':
                        changes = detectChanges(originalUser, req.body);
                        break;
                    case 'block':
                    case 'PUT':
                        changes = [{
                            field: 'status',
                            oldValue: originalUser.status,
                            newValue: updatedUser?.status || (operationType === 'block' ? 'blocked' : 'active')
                        }];
                        break;
                    case 'DELETE':
                        changes = [{
                            field: 'status',
                            oldValue: originalUser.status,
                            newValue: 'deleted'
                        }];
                        break;
                    case 'POST':
                        changes = ['name', 'email', 'role'].map(field => ({
                            field,
                            newValue: req.body[field]
                        }));
                        break;
                }

                await StaffOperation.create({
                    staffId: editorId,
                    subCompanyId,
                    operationType,
                    targetUserId,
                    changes
                });
            } catch (err) {
                console.error('Error logging staff operation:', err);
            }
        })();

        return result;
    };

    next();
};
