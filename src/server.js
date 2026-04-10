const app = require('./app');

const PORT = 5000;

app.listen(PORT, (err) => {
  if (err) {
    console.error("SERVER FAILED:", err);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
