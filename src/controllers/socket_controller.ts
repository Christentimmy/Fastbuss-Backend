import { Socket } from "socket.io";
import { Bus } from "../models/bus_model";
import { io } from "../config/socket";
import Trip from "../models/trip_model";
import checkRouteDeviation from "../utils/route_deviation";
import { IRoute } from "../types/route_types";
import { sendAlertEmail } from "../services/email_service";
import { SubCompany } from "../models/sub_company_model";
import { ITrip } from "../types/trip_types";
import {redisController} from "../controllers/redis_controller";
import { User } from "../models/user_model";
import locationService from "../services/location_service";


export const socketController = {
    updateBusLocation: async (socket: Socket) => {
       
        socket.on('driver:location:update', async ({ busId, latitude, longitude }) => {
            try {
                const bus = await Bus.findById(busId);
                if (!bus) return;
        
                // Update location
                bus.currentLocation = {
                    latitude,
                    longitude,
                    timestamp: new Date()
                };
                await bus.save();
        
                // Broadcast to Admins
                io.emit('admin:bus:location:update', {
                    busId,
                    latitude,
                    longitude
                });
        
                // Route Deviation Check
                const trip = await Trip.findOne({ busId, status: 'ongoing' }).populate<{ routeId: IRoute }>('routeId');
                if (!trip || !trip.routeId || !trip.routeId.waypoints) return;
        
                const isOffRoute = checkRouteDeviation({ latitude, longitude }, trip.routeId.waypoints);
                
        
                if (!isOffRoute) {
                    const flag = await redisController.getDeviationFlag(trip._id.toString());
                    if (flag) {
                        console.log(`Bus ${busId} is back on route, clearing deviation flag.`);
                        await redisController.removeDeviationFlag(trip._id.toString());
                    }
                    return;
                }
        
                const alreadyNotified = await redisController.getDeviationFlag(trip._id.toString());
                if (!alreadyNotified) {
                    const subCompany = await SubCompany.findById(trip.subCompanyId);
                    if (!subCompany) return;
        
                    const driver = await User.findById(trip.driverId);
                    if (!driver) return;
        
                    io.emit('admin:bus:route:deviation', { busId, latitude, longitude });

                    bus.currentLocation.address = await locationService.getAddressFromCoordinates(latitude, longitude);
                    await bus.save();
        
                    sendAlertEmail(
                        subCompany.companyName,
                        subCompany.contactEmail!,
                        trip as unknown as ITrip,
                        trip.routeId,
                        bus,
                        driver.name,
                        `https://logisticscorp.example.com/trip/${trip._id}`
                    );
        
                    await redisController.saveDeviationFlag(trip._id.toString());
                    console.log(`Deviation notification sent and saved for trip ${trip._id}`);
                }
        
            } catch (error) {
                console.error('Error updating driver location:', error);
            }
        });        
    },
};
