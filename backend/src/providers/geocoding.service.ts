import { Injectable, Logger } from '@nestjs/common';

type GeocodeResult = { latitude: number; longitude: number } | null;

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocode(address: string): Promise<GeocodeResult> {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key || !address?.trim()) {
      return null;
    }

    const url =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(address)}&key=${key}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(`Geocoding failed for "${address}": ${data.status}`);
        return null;
      }

      const loc = data.results[0].geometry.location;
      return { latitude: loc.lat, longitude: loc.lng };
    } catch (err) {
      this.logger.error(`Geocoding request error: ${err}`);
      return null;
    }
  }
}