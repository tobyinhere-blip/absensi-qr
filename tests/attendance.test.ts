import { prisma } from '../lib/db/prisma';
import { processQRScan } from '../lib/attendance/engine';
import { generateQRToken } from '../lib/qr/generator';
import assert from 'node:assert';

async function runTests() {
  console.log('=== STARTING AUTOMATED ACCEPTANCE TEST SUITE ===\n');

  // Setup Test Data
  const testClass = await prisma.class.upsert({
    where: { name: 'TEST CLASS 10' },
    update: {},
    create: { name: 'TEST CLASS 10', grade: '10', academic_year: '2025/2026' },
  });

  const activeToken = generateQRToken();
  const activeStudent = await prisma.student.upsert({
    where: { student_id: 'TEST_STD_001' },
    update: { qr_token: activeToken, status: 'active' },
    create: {
      student_id: 'TEST_STD_001',
      name: 'Test Student Active',
      class_id: testClass.id,
      qr_token: activeToken,
      status: 'active',
    },
  });

  const inactiveToken = generateQRToken();
  const inactiveStudent = await prisma.student.upsert({
    where: { student_id: 'TEST_STD_002' },
    update: { qr_token: inactiveToken, status: 'inactive' },
    create: {
      student_id: 'TEST_STD_002',
      name: 'Test Student Inactive',
      class_id: testClass.id,
      qr_token: inactiveToken,
      status: 'inactive',
    },
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const testSessionDate = `${year}-${month}-${day}`;

  const openSession = await prisma.attendanceSession.create({
    data: {
      name: 'Test Morning Session Open',
      date: testSessionDate,
      start_time: '07:00',
      late_after: '07:30',
      end_time: '08:30',
      status: 'open',
    },
  });

  const closedSession = await prisma.attendanceSession.create({
    data: {
      name: 'Test Morning Session Closed',
      date: testSessionDate,
      start_time: '07:00',
      late_after: '07:30',
      end_time: '08:30',
      status: 'closed',
    },
  });

  try {
    // TEST CASE 1: Valid Scan (On Time at 07:15)
    console.log('Running Test Case 1: Valid scan on-time...');
    const timeBeforeLate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 15, 0);
    const result1 = await processQRScan(activeToken, 'TestRunner', openSession.id, timeBeforeLate);

    if (!result1.success) {
      console.error('DEBUG Test 1 Error:', result1.error);
    }

    assert.strictEqual(result1.success, true);
    if (result1.success) {
      assert.strictEqual(result1.data.attendance.status, 'present');
      assert.strictEqual(result1.data.student.student_id, 'TEST_STD_001');
    }
    console.log('✓ PASS: Test Case 1 Passed.\n');

    // TEST CASE 2: Duplicate Scan Prevention
    console.log('Running Test Case 2: Duplicate scan...');
    const result2 = await processQRScan(activeToken, 'TestRunner', openSession.id, timeBeforeLate);
    assert.strictEqual(result2.success, false);
    if (!result2.success) {
      assert.strictEqual(result2.error.code, 'ALREADY_CHECKED_IN');
    }
    console.log('✓ PASS: Test Case 2 Passed.\n');

    // TEST CASE 3: Invalid QR Token
    console.log('Running Test Case 3: Invalid QR token...');
    const result3 = await processQRScan('INVALID_DUMMY_TOKEN', 'TestRunner', openSession.id);
    assert.strictEqual(result3.success, false);
    if (!result3.success) {
      assert.strictEqual(result3.error.code, 'INVALID_QR');
    }
    console.log('✓ PASS: Test Case 3 Passed.\n');

    // TEST CASE 4: Inactive Student
    console.log('Running Test Case 4: Inactive student scan...');
    const result4 = await processQRScan(inactiveToken, 'TestRunner', openSession.id);
    assert.strictEqual(result4.success, false);
    if (!result4.success) {
      assert.strictEqual(result4.error.code, 'STUDENT_INACTIVE');
    }
    console.log('✓ PASS: Test Case 4 Passed.\n');

    // TEST CASE 5: Closed Session
    console.log('Running Test Case 5: Closed session scan...');
    const result5 = await processQRScan(activeToken, 'TestRunner', closedSession.id);
    assert.strictEqual(result5.success, false);
    if (!result5.success) {
      assert.strictEqual(result5.error.code, 'SESSION_CLOSED');
    }
    console.log('✓ PASS: Test Case 5 Passed.\n');

    // TEST CASE 6 & 7: Time Threshold Status Calculation (Present vs Late at 07:45)
    console.log('Running Test Case 6 & 7: Late status calculation...');
    const lateToken = generateQRToken();
    await prisma.student.create({
      data: {
        student_id: 'TEST_STD_003',
        name: 'Test Student Late',
        class_id: testClass.id,
        qr_token: lateToken,
        status: 'active',
      },
    });

    const timeAfterLate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45, 0);
    const resultLate = await processQRScan(lateToken, 'TestRunner', openSession.id, timeAfterLate);
    assert.strictEqual(resultLate.success, true);
    if (resultLate.success) {
      assert.strictEqual(resultLate.data.attendance.status, 'late');
    }
    console.log('✓ PASS: Test Case 6 & 7 Passed.\n');

    console.log('===================================================');
    console.log('ALL 7 ACCEPTANCE TEST CASES PASSED SUCCESSFULLY! 🎉');
    console.log('===================================================');
  } finally {
    // Cleanup test sessions & students
    await prisma.attendance.deleteMany({ where: { session_id: { in: [openSession.id, closedSession.id] } } });
    await prisma.attendanceSession.deleteMany({ where: { id: { in: [openSession.id, closedSession.id] } } });
    await prisma.student.deleteMany({ where: { student_id: { in: ['TEST_STD_001', 'TEST_STD_002', 'TEST_STD_003'] } } });
    await prisma.class.deleteMany({ where: { id: testClass.id } });
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
