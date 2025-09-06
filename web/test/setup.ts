// Jest setup file
// Mock console methods to reduce test output noise
global.console = {
	...console,
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
};

// Polyfill setImmediate for Node.js environments that need it
if (typeof setImmediate === 'undefined') {
	(global as unknown as { setImmediate: typeof setTimeout }).setImmediate = setTimeout;
}
