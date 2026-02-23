import User from '../Models/User.js';
import Booking from '../Models/Booking.js';

// Get list of drivers (with filter for pending/verified)
export const getDrivers = async (req, res) => {
    try {
        console.log(`Admin ${req.user.email} fetching drivers...`);
        const { status } = req.query;
        let query = { role: 'driver' };

        if (status === 'pending') {
            query['driverApprovalStatus'] = 'pending';
        } else if (status === 'approved') {
            query['driverApprovalStatus'] = 'approved';
        } else if (status === 'rejected') {
            query['driverApprovalStatus'] = 'rejected';
        }

        const drivers = await User.find(query).select('-password');
        res.json({ success: true, data: drivers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Verify driver documents
export const verifyDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const driver = await User.findById(id);
        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        if (action === 'approve') {
            driver.driverApprovalStatus = 'approved';
            driver.verificationStatus = {
                email: true,
                phone: true, 
                idCard: true,
                communityTrusted: true
            };
            driver.driverDetails.isOnline = false;
            await driver.save();
            return res.json({ success: true, message: 'Driver approved successfully', data: driver });
            
        } else if (action === 'reject') {
            driver.driverApprovalStatus = 'rejected';
            driver.verificationStatus.communityTrusted = false;
            driver.verificationStatus.idCard = false;
            await driver.save();
            return res.json({ success: true, message: 'Driver rejected', data: driver });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get list of passengers
export const getPassengers = async (req, res) => {
    try {
        const passengers = await User.find({ role: 'passenger' }).select('-password');
        res.json({ success: true, data: passengers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Toggle user block status
export const toggleBlockStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get ride history for a specific passenger
export const getPassengerRides = async (req, res) => {
    try {
        const { id } = req.params;
        const rides = await Booking.find({ passenger: id })
            .populate('driver', 'name phone profileImage')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, data: rides });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get transaction history for a specific passenger
export const getPassengerTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        
        // For now, transactions are inferred from completed or paid bookings. 
        // We'll return bookings that have a finalFare > 0.
        const rides = await Booking.find({ 
            passenger: id, 
            status: { $in: ['completed', 'cancelled'] } // cancelled might have cancellation fees later
        })
        .populate('driver', 'name')
        .sort({ createdAt: -1 });

        const transactions = rides.map(ride => {
            const isRefund = ride.status === 'cancelled' && ride.paymentStatus === 'completed'; // basic logic
            return {
                id: ride._id,
                date: ride.createdAt,
                type: isRefund ? 'Refund' : 'Payment',
                amount: ride.finalFare || ride.offeredFare || ride.estimatedFare, // Fallback fields
                method: ride.paymentMethod || 'cash',
                status: isRefund ? 'processed' : ride.paymentStatus === 'completed' ? 'success' : 'pending',
                relatedTo: ride.driver ? ride.driver.name : 'Unknown Driver',
                rideId: ride._id
            };
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const totalPassengers = await User.countDocuments({ role: 'passenger' });
        const totalDrivers = await User.countDocuments({ role: 'driver' });
        const activeDrivers = await User.countDocuments({ role: 'driver', driverApprovalStatus: 'approved' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newRegistrationsToday = await User.countDocuments({ createdAt: { $gte: today } });

        // Revenue stats
        const revenueStats = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: '$finalFare' },
                todayRevenue: { 
                    $sum: { 
                        $cond: [{ $gte: ['$createdAt', today] }, '$finalFare', 0] 
                    }
                }
            }}
        ]);

        const stats = {
            totalPassengers,
            totalDrivers,
            activeDrivers,
            newRegistrationsToday,
            dailyRevenue: revenueStats[0]?.todayRevenue || 0,
            totalRevenue: revenueStats[0]?.totalRevenue || 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get detailed financial overview
export const getFinancialOverview = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: {
                _id: null,
                totalCollection: { $sum: '$finalFare' },
                totalCommission: { $sum: { $multiply: ['$finalFare', 0.15] } }, // Assuming 15% flat commission for now
                totalPayouts: { $sum: { $multiply: ['$finalFare', 0.85] } }
            }}
        ]);

        const data = stats[0] || { totalCollection: 0, totalCommission: 0, totalPayouts: 0 };
        
        res.json({ success: true, data: {
            ...data,
            netProfit: data.totalCommission // Simple representation: commission is platform profit
        }});
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
