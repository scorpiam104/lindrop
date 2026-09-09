const { queueRecoveryCampaign } = require('../controllers/recoveryController');

function startRecoveryScheduler() {
  const intervalMs = Number(process.env.RECOVERY_CHECK_INTERVAL_MS || 5 * 60 * 1000);

  setInterval(async () => {
    try {
      await queueRecoveryCampaign({
        body: {}
      }, {
        json(payload) {
          return payload;
        }
      });
    } catch (error) {
      console.error('Recovery scheduler failed:', error.message);
    }
  }, intervalMs).unref();

  console.log(`Abandoned cart recovery scheduler started with ${intervalMs}ms interval.`);
}

module.exports = { startRecoveryScheduler };
