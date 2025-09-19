import { notificationModel } from "../database";
import { send_real_time_update } from "./socket";

export const create_and_emit_notification = async ({ userId, title, message, eventType, meta }: any) => {
    try {
        const notification = await notificationModel.create({ userId, title, message, eventType, meta });
        const targetUserIds: string[] = [String(userId)];

        for (const targetId of targetUserIds) {
            const unreadCount = await notificationModel.countDocuments({ userId: targetId, isRead: false });

            await send_real_time_update([targetId], {
                eventType,
                data: { userId, notificationId: String(notification._id), title, message, meta, unreadCount }
            });
        }

        return notification;
    } catch (error) {
        throw error;
    }
}