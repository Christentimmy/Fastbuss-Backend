import mongoose, { Schema } from 'mongoose';

export interface IStaffOperation {
    staffId: mongoose.Types.ObjectId;
    subCompanyId: mongoose.Types.ObjectId;
    operationType: 'create' | 'update' | 'delete' | 'block' | 'unblock';
    targetUserId?: mongoose.Types.ObjectId;
    changes?: {
        field: string;
        oldValue?: any;
        newValue?: any;
    }[];
    timestamp: Date;
}

const StaffOperationSchema = new Schema<IStaffOperation>({
    staffId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    subCompanyId: { type: Schema.Types.ObjectId, ref: 'SubCompany', required: true },
    operationType: { 
        type: String, 
        enum: ['create', 'update', 'delete', 'block', 'unblock'],
        required: true 
    },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'Users' },
    changes: [{
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed
    }],
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const StaffOperation = mongoose.model<IStaffOperation>('StaffOperations', StaffOperationSchema); 