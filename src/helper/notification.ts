import { ROLES } from "../common";
import { notificationModel, userModel } from "../database";
import { send_real_time_update } from "./socket";

export const create_and_emit_notification = async ({ userId, title, message, eventType, meta }: any) => {
    try {
        const notification = await notificationModel.create({ userId, title, message, eventType, meta });
        const targetUserIds: string[] = [String(userId)];
        const hrAndAdmins = await userModel.find({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR] } }, "_id");
        hrAndAdmins.forEach((u) => targetUserIds.push(String(u._id)));
        await send_real_time_update(hrAndAdmins, {
            eventType: eventType,
            data: { userId, notificationId: String(notification._id), title, message, meta }
        });
        return notification;
    } catch (error) {
        throw error;
    }
}