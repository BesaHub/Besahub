#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk4NDAyMTAsImV4cCI6MTc1OTkyNjYxMH0.3K5apxXUSAxl0KAuhYLBcb-2vtZ-V-R6EKleQlgRwYg';

async function testTasksAPI() {
  try {
    console.log('🧪 Testing Tasks API...\n');

    // Test 1: Get all tasks
    console.log('1️⃣ Testing GET /api/tasks');
    const tasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, limit: 100 }
    });

    console.log(`✅ Retrieved ${tasksResponse.data.tasks.length} tasks`);
    console.log(`📊 Total tasks: ${tasksResponse.data.pagination.totalItems}`);
    
    // Show first task structure
    if (tasksResponse.data.tasks.length > 0) {
      const firstTask = tasksResponse.data.tasks[0];
      console.log('\n📋 Sample task structure:');
      console.log('- ID:', firstTask.id);
      console.log('- Title:', firstTask.title);
      console.log('- Status:', firstTask.status);
      console.log('- Priority:', firstTask.priority);
      console.log('- Task Type:', firstTask.taskType);
      console.log('- Due Date:', firstTask.dueDate);
      console.log('- Assigned To:', firstTask.assignedTo ? 
        `${firstTask.assignedTo.firstName} ${firstTask.assignedTo.lastName}` : 'None');
    }

    // Test 2: Test filters
    console.log('\n2️⃣ Testing filters');
    
    // Test status filter
    const pendingTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { status: 'pending', page: 1, limit: 100 }
    });
    console.log(`✅ Pending tasks: ${pendingTasks.data.tasks.length}`);

    // Test priority filter
    const urgentTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { priority: 'urgent', page: 1, limit: 100 }
    });
    console.log(`✅ Urgent tasks: ${urgentTasks.data.tasks.length}`);

    // Test overdue filter
    const overdueTasks = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { overdue: true, page: 1, limit: 100 }
    });
    console.log(`✅ Overdue tasks: ${overdueTasks.data.tasks.length}`);

    // Test 3: Create a new task
    console.log('\n3️⃣ Testing task creation');
    const newTask = await axios.post(`${API_URL}/tasks`, {
      title: 'Test Task - API Verification',
      description: 'This is a test task created via API',
      taskType: 'other',
      status: 'pending',
      priority: 'low',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log(`✅ Created task with ID: ${newTask.data.id}`);

    // Test 4: Update the task
    console.log('\n4️⃣ Testing task update');
    const updatedTask = await axios.put(`${API_URL}/tasks/${newTask.data.id}`, {
      title: 'Updated Test Task',
      priority: 'medium'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log(`✅ Updated task: ${updatedTask.data.title}`);

    // Test 5: Mark task as complete
    console.log('\n5️⃣ Testing task completion');
    await axios.post(`${API_URL}/tasks/${newTask.data.id}/complete`, {}, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log(`✅ Task marked as complete`);

    // Test 6: Delete the task
    console.log('\n6️⃣ Testing task deletion');
    await axios.delete(`${API_URL}/tasks/${newTask.data.id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log(`✅ Task deleted successfully`);

    console.log('\n✅ All API tests passed successfully!');
    console.log('The Tasks API is working correctly.\n');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

testTasksAPI();