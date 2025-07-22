import { MockLlmService } from './mockLlmService';

async function testMockService() {
  const service = new MockLlmService();
  
  console.log('Testing "Verhuringen afgelopen week"...');
  const response1 = await service.sendMessage('Verhuringen afgelopen week');
  console.log('Response:', response1[response1.length - 1].content);
  
  console.log('\nTesting follow-up response "Amsterdam"...');
  const response2 = await service.sendMessage('Amsterdam');
  console.log('Response:', response2[response2.length - 1].content);
  
  console.log('\nTesting follow-up response "herkomst"...');
  const response3 = await service.sendMessage('herkomst');
  console.log('Response:', response3[response3.length - 1].content);
  
  console.log('\nTesting follow-up response "nu"...');
  const response4 = await service.sendMessage('nu');
  console.log('Response:', response4[response4.length - 1].content);
}

// Run the test
testMockService().catch(console.error); 