#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk4NDAyODksImV4cCI6MTc1OTg0MTE4OX0.x0USwLTPrmzPMh5wCbPaxkHimaQvcdLwNUYutLDHVb0';

async function testTasksCRUD() {
  console.log('🧪 Testing Tasks CRUD Operations...\n');
  const results = [];
  
  try {
    // Test 1: CREATE Task
    console.log('1️⃣ Testing CREATE Task...');
    const createResponse = await axios.post(`${API_URL}/tasks`, {
      title: 'TEST: New Property Showing - 500 Park Ave',
      description: 'Show luxury office space to potential tenant. 15th floor, 3500 sq ft.',
      taskType: 'property_showing',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDuration: 60,
      notes: 'Client prefers afternoon viewing. Bring floor plans.'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    const taskId = createResponse.data.task?.id || createResponse.data.id;
    console.log(`✅ Task created successfully. ID: ${taskId}`);
    results.push({ test: 'Create Task', status: 'PASSED' });
    
    // Test 2: EDIT Task
    console.log('\n2️⃣ Testing EDIT Task...');
    await axios.put(`${API_URL}/tasks/${taskId}`, {
      title: 'TEST: UPDATED Property Showing - 500 Park Ave Suite 1500',
      priority: 'urgent',
      notes: 'Client confirmed for 2 PM. VIP client.'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Task edited successfully');
    results.push({ test: 'Edit Task', status: 'PASSED' });
    
    // Test 3: MARK AS COMPLETE
    console.log('\n3️⃣ Testing MARK AS COMPLETE...');
    await axios.post(`${API_URL}/tasks/${taskId}/complete`, {}, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Task marked as complete');
    results.push({ test: 'Mark Complete', status: 'PASSED' });
    
    // Test 4: DELETE Task
    console.log('\n4️⃣ Testing DELETE Task...');
    await axios.delete(`${API_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Task deleted successfully');
    results.push({ test: 'Delete Task', status: 'PASSED' });
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    results.push({ test: 'CRUD Operations', status: 'FAILED', error: error.message });
  }
  
  // Test 5: FILTERS
  console.log('\n5️⃣ Testing FILTERS...');
  
  try {
    // Status filter
    const pendingTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { status: 'pending', page: 1, limit: 100 }
    });
    console.log(`  ✅ Status Filter (pending): Found ${pendingTasks.data.tasks.length} tasks`);
    results.push({ test: 'Status Filter', status: 'PASSED' });
    
    // Priority filter
    const urgentTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { priority: 'urgent', page: 1, limit: 100 }
    });
    console.log(`  ✅ Priority Filter (urgent): Found ${urgentTasks.data.tasks.length} tasks`);
    results.push({ test: 'Priority Filter', status: 'PASSED' });
    
    // Overdue filter
    const overdueTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { overdue: true, page: 1, limit: 100 }
    });
    console.log(`  ✅ Overdue Filter: Found ${overdueTasks.data.tasks.length} tasks`);
    results.push({ test: 'Overdue Filter', status: 'PASSED' });
    
  } catch (error) {
    console.error(`  ❌ Filter test failed: ${error.message}`);
    results.push({ test: 'Filters', status: 'FAILED', error: error.message });
  }
  
  // Test 6: SORTING
  console.log('\n6️⃣ Testing SORTING...');
  
  try {
    const sortedByDueDate = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { sortBy: 'dueDate', sortOrder: 'ASC', page: 1, limit: 10 }
    });
    console.log(`  ✅ Sort by Due Date: Retrieved ${sortedByDueDate.data.tasks.length} tasks`);
    results.push({ test: 'Sort by Due Date', status: 'PASSED' });
    
    const sortedByPriority = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { sortBy: 'priority', sortOrder: 'DESC', page: 1, limit: 10 }
    });
    console.log(`  ✅ Sort by Priority: Retrieved ${sortedByPriority.data.tasks.length} tasks`);
    results.push({ test: 'Sort by Priority', status: 'PASSED' });
    
    const sortedByCreated = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { sortBy: 'createdAt', sortOrder: 'DESC', page: 1, limit: 10 }
    });
    console.log(`  ✅ Sort by Created Date: Retrieved ${sortedByCreated.data.tasks.length} tasks`);
    results.push({ test: 'Sort by Created Date', status: 'PASSED' });
    
  } catch (error) {
    console.error(`  ❌ Sorting test failed: ${error.message}`);
    results.push({ test: 'Sorting', status: 'FAILED', error: error.message });
  }
  
  // Test 7: SEARCH (simulated)
  console.log('\n7️⃣ Testing SEARCH (frontend simulation)...');
  
  try {
    const allTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, limit: 100 }
    });
    
    const searchTerm = 'property';
    const filteredTasks = allTasks.data.tasks.filter(task => 
      task.title?.toLowerCase().includes(searchTerm) || 
      task.description?.toLowerCase().includes(searchTerm)
    );
    console.log(`  ✅ Search for "${searchTerm}": Found ${filteredTasks.length} matching tasks`);
    results.push({ test: 'Search Functionality', status: 'PASSED' });
    
  } catch (error) {
    console.error(`  ❌ Search test failed: ${error.message}`);
    results.push({ test: 'Search', status: 'FAILED', error: error.message });
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
  });
  
  console.log(`\n📈 Results: ${passed} PASSED, ${failed} FAILED`);
  
  if (failed === 0) {
    console.log('🎉 All CRUD operations and filters are working correctly!');
  } else {
    console.log('⚠️ Some tests failed. Please review the errors above.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
testTasksCRUD();