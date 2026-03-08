import app from './app';

const PORT = process.env.PORT || 3056;

const server = app.listen(PORT, () => {
    console.log(`App start with http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => console.log('\nExit server express'));
});
