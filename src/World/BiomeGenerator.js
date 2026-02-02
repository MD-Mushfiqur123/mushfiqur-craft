import { createNoise2D } from 'simplex-noise';

export class BiomeGenerator {
    constructor(seed) {
        this.seed = seed;
        this.elevationNoise = createNoise2D(() => Math.random()); // Seeding not fully implemented in local simplex, using random for now
        this.tempNoise = createNoise2D();
        this.humidityNoise = createNoise2D();
    }

    getBiome(x, z) {
        // Normalize coordinates for large scale features
        const scale = 0.005;
        const elevation = this.elevationNoise(x * scale, z * scale);
        const temperature = this.tempNoise(x * scale * 2, z * scale * 2);
        const humidity = this.humidityNoise(x * scale * 2, z * scale * 2);

        return { elevation, temperature, humidity };
    }

    getBlockForColumn(x, y, z, biomeData) {
        const { elevation, temperature, humidity } = biomeData;

        // Base terrain height from elevation (-1 to 1) mapped to 30-100
        // Add some small detail noise
        // This logic will be moved to Chunk generation loop for performance
        // But here we define the 'rules'

        // Return Block ID
        return 0;
    }
}
