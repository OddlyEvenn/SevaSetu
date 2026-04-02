// eslint-disable-next-line @typescript-eslint/no-require-imports
const net = require('net');

const HOST = 'ep-spring-cherry-aml60kub-pooler.c-5.us-east-1.aws.neon.tech';
const PORT = 5432;

console.log(`Checking if port ${PORT} is open on ${HOST}...`);

const socket = net.createConnection(PORT, HOST, () => {
  console.log('✅ SUCCESS: Port is OPEN! Your network can reach Supabase.');
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('❌ FAILURE: Port is CLOSED or BLOCKED.');
  console.error(`Error Detail: ${err.message}`);
  process.exit(1);
});

socket.setTimeout(5000, () => {
  console.error('❌ FAILURE: Connection TIMED OUT.');
  socket.destroy();
  process.exit(1);
});
