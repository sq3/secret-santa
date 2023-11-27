const handler = require('./handler');

test('should calculate the correct receiver index', () => {
  const shuffledParticipants = ['Alice', 'Bob', 'Charlie', 'Dave'];
  const i = 0;
  const expectedReceiverIndex = 1;

  const receiverIndex = handler.calculateReceiverIndex(i, shuffledParticipants);

  expect(receiverIndex).toBe(expectedReceiverIndex);
});