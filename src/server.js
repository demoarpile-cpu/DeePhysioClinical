const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    console.error("SERVER FAILED:", err);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
