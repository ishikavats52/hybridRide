import Booking from './Models/Booking.js';
import User from './Models/User.js';
import mongoose from 'mongoose';

const resetActiveRides = async () => {
    try {
        await mongoose.connect('mongodb+srv://sishika077_db_user:uzZCLOy8bAsiWUai@cluster0.1fkvpy3.mongodb.net/?appName=Cluster0');
        console.log('Connected to DB');

        const activeRides = await Booking.find({
            status: { $in: ['accepted', 'arrived', 'ongoing'] }
        });
        
        console.log(`Found ${activeRides.length} active rides to cancel.`);

        for (const ride of activeRides) {
            ride.status = 'cancelled';
            ride.cancellationReason = 'Manual system reset';
            await ride.save();
            console.log(`Cancelled ride ${ride._id}`);
        }

        console.log('Done cleaning up rides.');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
};

resetActiveRides();
