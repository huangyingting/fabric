import { runBootstrapAdmin } from '../scripts/bootstrap-admin';

runBootstrapAdmin()
  .then(() => {
    console.log('Seed finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
