import bcrypt from 'bcryptjs';
import { userModel } from '../database';
import { ROLES } from '../common';
import { createData, getFirstMatch } from '../helper';

export const seedAdminUser = async () => {
    try {
        const existingAdmin = await getFirstMatch(userModel, {
            role: ROLES.ADMIN,
            isDeleted: false
        }, {}, {});

        if (existingAdmin) {
            return;
        }

        const adminPassword = 'Admin@123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        const adminUser = await createData(userModel, {
            firstName: 'Pramit',
            lastName: "Mangukiya",
            fullName: "Pramit Mangukiya",
            email: 'pramitmangukiya602@gmail.com',
            password: hashedPassword,
            role: ROLES.ADMIN,
            department: 'IT',
            designation: 'System Administrator',
            contactNumber: '+919725097885',
            isEmailVerified: true
        });

        console.log('Admin user created successfully:', adminUser.fullName);

    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}; 