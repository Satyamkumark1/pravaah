/**
 * Sample Videos Configuration
 * 
 * Configure your Cloudflare R2 video URLs here for judge testing
 * Update these URLs with your actual Cloudflare R2 bucket URLs
 */

export interface SampleVideo {
  name: string;
  url: string;
  description: string;
}

export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    name: 'Safe Flow',
    url: 'https://your-cloudflare-r2-bucket.com/safe.mp4',
    description: 'Normal crowd flow - LOW risk scenario'
  },
  {
    name: 'Busy Flow', 
    url: 'https://your-cloudflare-r2-bucket.com/busy.mp4',
    description: 'Moderate crowd density - ELEVATED risk scenario'
  },
  {
    name: 'Critical Flow',
    url: 'https://your-cloudflare-r2-bucket.com/critical.mp4', 
    description: 'High crowd turbulence - HIGH risk scenario'
  }
];

// Add more sample videos as needed for judge testing
// Example:
// {
//   name: 'Stadium Exit',
//   url: 'https://your-cloudflare-r2-bucket.com/stadium_exit.mp4',
//   description: 'Rapid stadium exit scenario'
// }