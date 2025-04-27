import axios from 'axios';

interface LocationIQResponse {
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
}

class LocationService {
    private apiKey: string;
    private baseUrl: string = 'https://us1.locationiq.com/v1/reverse';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
        try {
            const response = await axios.get<LocationIQResponse>(this.baseUrl, {
                params: {
                    key: this.apiKey,
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    'accept-language': 'en'
                }
            });

            const { display_name, address } = response.data;
            
            // Format the address in a readable way
            const formattedAddress = this.formatAddress(address);
            
            return formattedAddress || display_name;
        } catch (error) {
            console.error('Error getting address from coordinates:', error);
            return 'Unknown Location';
        }
    }

    private formatAddress(address: LocationIQResponse['address']): string {
        const parts = [];
        
        if (address.road) parts.push(address.road);
        if (address.suburb) parts.push(address.suburb);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.postcode) parts.push(address.postcode);
        if (address.country) parts.push(address.country);

        return parts.join(', ');
    }
}

// Create a singleton instance
const locationService = new LocationService(process.env.LOCATIONIQ_API_KEY || '');

export default locationService; 