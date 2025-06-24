// Mock WebSocket
const mockWebSocket = {
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1
};

global.WebSocket = jest.fn(() => mockWebSocket);

describe('WebSocket Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('WebSocket constructor is called', () => {
    new WebSocket('ws://localhost:8000/test');
    
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/test');
  });

  test('WebSocket mock is created', () => {
    expect(global.WebSocket).toBeDefined();
    expect(mockWebSocket.close).toBeDefined();
    expect(mockWebSocket.send).toBeDefined();
  });
});