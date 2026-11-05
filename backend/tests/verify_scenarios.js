const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');

const {
  createRequest,
  getMyRequests,
  updateRequestStatus,
  getConnections,
} = require('../controllers/requestController');

const {
  removeSkillListing,
  toggleBanStudent,
} = require('../controllers/adminController');

const {
  exploreSkills,
} = require('../controllers/skillController');

const {
  getPublicStudentProfile,
} = require('../controllers/userController');

// Mock Express req, res, next
const mockReqRes = (sessionUser, body = {}, params = {}, query = {}) => {
  const req = {
    user: sessionUser,
    session: { userId: sessionUser ? sessionUser._id : null, role: sessionUser ? sessionUser.role : null },
    body,
    params,
    query,
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next };
};

const runAllTests = async () => {
  const results = {
    testA: { name: 'Test A: Deleted Skill Handling', passed: false, steps: [] },
    testB: { name: 'Test B: Banned Student Handling & Unban Behavior', passed: false, steps: [] },
    testC: { name: 'Test C: Preservation of Unrelated Connections', passed: false, steps: [] },
    testD: { name: 'Test D: Direct Backend API Security & Privacy Validation', passed: false, steps: [] },
  };

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Test Suite] Connected to database.');

    // Cleanup any lingering test records
    await User.deleteMany({ email: { $regex: /^test_e2e_/ } });
    await Skill.deleteMany({ title: { $regex: /^Test E2E / } });
    console.log('[Test Suite] Cleaned previous test artifacts.');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST A: DELETED SKILL
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Running Test A: Deleted Skill ---');
    // 1. Create Student A and Student B
    const studentA = await User.create({
      name: 'Test Geethika',
      email: 'test_e2e_geethika@skillswap.edu',
      password: 'password123',
      role: 'student',
      college: 'Engineering College',
      department: 'CSE',
      contactInfo: { phone: '9876543210', linkedin: 'https://linkedin.com/in/geethika' },
    });

    const studentB = await User.create({
      name: 'Test Poojitha',
      email: 'test_e2e_poojitha@skillswap.edu',
      password: 'password123',
      role: 'student',
      college: 'Technology College',
      department: 'ECE',
      contactInfo: { phone: '9123456789', linkedin: 'https://linkedin.com/in/poojitha' },
    });
    results.testA.steps.push('Created test students Geethika and Poojitha');

    // 2. Student A creates Computer Vision skill
    const cvSkill = await Skill.create({
      title: 'Test E2E Computer Vision',
      description: 'Image processing and deep learning with OpenCV and PyTorch',
      category: 'Programming & Tech',
      type: 'Teaching',
      level: 'Intermediate',
      user: studentA._id,
    });
    results.testA.steps.push('Student A created Computer Vision skill');

    // 3. Student B requests the skill
    const reqCreate = mockReqRes(studentB, { skillId: cvSkill._id.toString(), message: 'Would love to learn!' });
    await createRequest(reqCreate.req, reqCreate.res, reqCreate.next);
    const createdReq = reqCreate.res.getData().request;
    if (reqCreate.res.getStatusCode() !== 201) throw new Error('Failed to create skill request');
    results.testA.steps.push('Student B requested Computer Vision skill');

    // 4. Student A accepts the request
    const reqAccept = mockReqRes(studentA, { status: 'Accepted' }, { id: createdReq._id.toString() });
    await updateRequestStatus(reqAccept.req, reqAccept.res, reqAccept.next);
    if (reqAccept.res.getStatusCode() !== 200) throw new Error('Failed to accept skill request');
    results.testA.steps.push('Student A accepted the request');

    // 5. Verify both see the active connection and unlocked contact details
    const connA1 = mockReqRes(studentA);
    await getConnections(connA1.req, connA1.res, connA1.next);
    const connB1 = mockReqRes(studentB);
    await getConnections(connB1.req, connB1.res, connB1.next);

    const aData1 = connA1.res.getData();
    const bData1 = connB1.res.getData();

    if (aData1.count !== 1 || bData1.count !== 1) {
      throw new Error(`Expected 1 active connection, got A:${aData1.count}, B:${bData1.count}`);
    }
    if (aData1.connections[0].peer.email !== studentB.email || bData1.connections[0].peer.email !== studentA.email) {
      throw new Error('Contact information not properly unlocked');
    }
    results.testA.steps.push('Both students confirmed active connection with unlocked contact details');

    // 6. Admin deletes the Computer Vision skill
    const adminUser = await User.findOne({ role: 'admin' }) || { _id: new mongoose.Types.ObjectId(), role: 'admin' };
    const adminDelete = mockReqRes(adminUser, {}, { id: cvSkill._id.toString() });
    await removeSkillListing(adminDelete.req, adminDelete.res, adminDelete.next);
    if (adminDelete.res.getStatusCode() !== 200) throw new Error('Admin failed to delete skill');
    results.testA.steps.push('Admin deleted the Computer Vision skill listing');

    // 7. Verify connection disappears from both students' Connections pages
    const connA2 = mockReqRes(studentA);
    await getConnections(connA2.req, connA2.res, connA2.next);
    const connB2 = mockReqRes(studentB);
    await getConnections(connB2.req, connB2.res, connB2.next);

    const aData2 = connA2.res.getData();
    const bData2 = connB2.res.getData();

    if (aData2.count !== 0 || bData2.count !== 0) {
      throw new Error(`Expected 0 connections after deletion, got A:${aData2.count}, B:${bData2.count}`);
    }
    results.testA.steps.push('Computer Vision connection completely disappeared from both students (count = 0)');

    // 8. Verify neither student can view contact details via public profile
    const profileReq = mockReqRes(studentB, {}, { id: studentA._id.toString() });
    await getPublicStudentProfile(profileReq.req, profileReq.res, profileReq.next);
    const profileData = profileReq.res.getData().profile;
    if (profileData.isConnected === true || profileData.contactInfo.phone !== 'Protected (Visible upon accepted request)') {
      throw new Error('Contact info still exposed after skill deletion');
    }
    results.testA.steps.push('Contact information locked and protected after deletion');

    // 9. Verify new request for deleted skill is blocked
    const newReqTry = mockReqRes(studentB, { skillId: cvSkill._id.toString() });
    await createRequest(newReqTry.req, newReqTry.res, newReqTry.next);
    if (newReqTry.res.getStatusCode() !== 404) {
      throw new Error(`Expected 404 on deleted skill request, got ${newReqTry.res.getStatusCode()}`);
    }
    results.testA.steps.push('New requests for deleted skill correctly blocked with 404');
    results.testA.passed = true;
    console.log('✅ Test A Passed');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST B: BANNED STUDENT & UNBAN BEHAVIOR
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Running Test B: Banned Student ---');
    // 1. Create new skill and establish accepted connection
    const nlpSkill = await Skill.create({
      title: 'Test E2E NLP',
      description: 'Transformers and LLMs',
      category: 'Programming & Tech',
      type: 'Teaching',
      level: 'Advanced',
      user: studentA._id,
    });

    const bReqNlp = mockReqRes(studentB, { skillId: nlpSkill._id.toString() });
    await createRequest(bReqNlp.req, bReqNlp.res, bReqNlp.next);
    const nlpReqId = bReqNlp.res.getData().request._id;

    const aAcceptNlp = mockReqRes(studentA, { status: 'Accepted' }, { id: nlpReqId.toString() });
    await updateRequestStatus(aAcceptNlp.req, aAcceptNlp.res, aAcceptNlp.next);

    // Verify connection exists
    const bConnCheck1 = mockReqRes(studentB);
    await getConnections(bConnCheck1.req, bConnCheck1.res, bConnCheck1.next);
    if (bConnCheck1.res.getData().count !== 1) throw new Error('Initial connection setup failed');
    results.testB.steps.push('Connection established for NLP skill between Student A and B');

    // 2. Admin bans Student A
    const banReq = mockReqRes(adminUser, {}, { id: studentA._id.toString() });
    await toggleBanStudent(banReq.req, banReq.res, banReq.next);
    studentA.isBanned = true;
    results.testB.steps.push('Admin banned Student A');

    // 3. Student A loses access to student connections API
    const aConnBanned = mockReqRes(studentA);
    await getConnections(aConnBanned.req, aConnBanned.res, aConnBanned.next);
    if (aConnBanned.res.getStatusCode() !== 403) {
      throw new Error(`Expected 403 for banned student, got ${aConnBanned.res.getStatusCode()}`);
    }
    results.testB.steps.push('Banned student A blocked from connections API with 403');

    // 4. Student B no longer sees connection with Student A
    const bConnAfterBan = mockReqRes(studentB);
    await getConnections(bConnAfterBan.req, bConnAfterBan.res, bConnAfterBan.next);
    if (bConnAfterBan.res.getData().count !== 0) {
      throw new Error(`Expected 0 connections for B, got ${bConnAfterBan.res.getData().count}`);
    }
    results.testB.steps.push('Student B no longer sees connection with banned Student A');

    // 5. Banned student listings disappear from Explore
    const exploreReq = mockReqRes(studentB);
    await exploreSkills(exploreReq.req, exploreReq.res, exploreReq.next);
    const exploreSkillsList = exploreReq.res.getData().skills;
    const hasBannedSkills = exploreSkillsList.some((s) => s.user?._id?.toString() === studentA._id.toString());
    if (hasBannedSkills) {
      throw new Error('Banned student skills still visible in Explore');
    }
    results.testB.steps.push('Banned student listings completely hidden from Explore');

    // 6. Admin unbans Student A
    const unbanReq = mockReqRes(adminUser, {}, { id: studentA._id.toString() });
    await toggleBanStudent(unbanReq.req, unbanReq.res, unbanReq.next);
    studentA.isBanned = false;
    results.testB.steps.push('Admin unbanned Student A');

    // 7. Old connection MUST NOT automatically restore
    const bConnAfterUnban = mockReqRes(studentB);
    await getConnections(bConnAfterUnban.req, bConnAfterUnban.res, bConnAfterUnban.next);
    const aConnAfterUnban = mockReqRes(studentA);
    await getConnections(aConnAfterUnban.req, aConnAfterUnban.res, aConnAfterUnban.next);

    if (bConnAfterUnban.res.getData().count !== 0 || aConnAfterUnban.res.getData().count !== 0) {
      throw new Error('Old connections automatically restored after unbanning! Violation of privacy rule.');
    }
    results.testB.steps.push('Old connections remained inactive after unban (count = 0). Not automatically restored.');
    results.testB.passed = true;
    console.log('✅ Test B Passed');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST C: UNRELATED CONNECTIONS PRESERVED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Running Test C: Unrelated Connections ---');
    // Create Student C
    const studentC = await User.create({
      name: 'Test Harika',
      email: 'test_e2e_harika@skillswap.edu',
      password: 'password123',
      role: 'student',
      college: 'Science College',
      department: 'Math',
      contactInfo: { phone: '9988776655' },
    });

    // Create 2 skills for Student A
    const cvSkill2 = await Skill.create({
      title: 'Test E2E Computer Vision 2',
      description: 'CV 2 description',
      category: 'Programming & Tech',
      type: 'Teaching',
      user: studentA._id,
    });

    const pythonSkill = await Skill.create({
      title: 'Test E2E Python Basics',
      description: 'Core Python and Data Structures',
      category: 'Programming & Tech',
      type: 'Teaching',
      user: studentA._id,
    });

    // Connect Student A with B via CV 2
    const reqB = mockReqRes(studentB, { skillId: cvSkill2._id.toString() });
    await createRequest(reqB.req, reqB.res, reqB.next);
    const reqBId = reqB.res.getData().request._id;
    const acceptB = mockReqRes(studentA, { status: 'Accepted' }, { id: reqBId.toString() });
    await updateRequestStatus(acceptB.req, acceptB.res, acceptB.next);

    // Connect Student A with C via Python
    const reqC = mockReqRes(studentC, { skillId: pythonSkill._id.toString() });
    await createRequest(reqC.req, reqC.res, reqC.next);
    const reqCId = reqC.res.getData().request._id;
    const acceptC = mockReqRes(studentA, { status: 'Accepted' }, { id: reqCId.toString() });
    await updateRequestStatus(acceptC.req, acceptC.res, acceptC.next);

    // Verify Student A has 2 connections (B and C)
    const connACheck1 = mockReqRes(studentA);
    await getConnections(connACheck1.req, connACheck1.res, connACheck1.next);
    if (connACheck1.res.getData().count !== 2) {
      throw new Error(`Expected 2 connections, got ${connACheck1.res.getData().count}`);
    }
    results.testC.steps.push('Student A connected with Student B (CV 2) and Student C (Python)');

    // Admin deletes ONLY CV 2
    const delCV2 = mockReqRes(adminUser, {}, { id: cvSkill2._id.toString() });
    await removeSkillListing(delCV2.req, delCV2.res, delCV2.next);
    results.testC.steps.push('Admin deleted only Computer Vision 2 listing');

    // Verify Student A now has ONLY Student C (Python), and Student B connection is removed
    const connACheck2 = mockReqRes(studentA);
    await getConnections(connACheck2.req, connACheck2.res, connACheck2.next);
    const aDataAfterDel = connACheck2.res.getData();

    if (aDataAfterDel.count !== 1) {
      throw new Error(`Expected exactly 1 connection remaining, got ${aDataAfterDel.count}`);
    }
    if (aDataAfterDel.connections[0].peer.email !== studentC.email) {
      throw new Error('Wrong connection remained active');
    }
    if (aDataAfterDel.connections[0].connectedSkills[0].title !== 'Test E2E Python Basics') {
      throw new Error('Remaining skill does not match Python');
    }

    // Verify Student B now has 0 connections
    const connBCheck2 = mockReqRes(studentB);
    await getConnections(connBCheck2.req, connBCheck2.res, connBCheck2.next);
    if (connBCheck2.res.getData().count !== 0) {
      throw new Error('Student B connection was not removed');
    }
    results.testC.steps.push('CV 2 connection removed; Python connection with Student C preserved intact');
    results.testC.passed = true;
    console.log('✅ Test C Passed');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST D: DIRECT BACKEND API SECURITY & PRIVACY VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Running Test D: API Security ---');
    // 1. Create a dummy request then delete skill, then try to direct-call Accept
    const webSkill = await Skill.create({
      title: 'Test E2E Web Dev',
      description: 'HTML CSS JS',
      category: 'Programming & Tech',
      type: 'Teaching',
      user: studentA._id,
    });

    const webReq = mockReqRes(studentB, { skillId: webSkill._id.toString() });
    await createRequest(webReq.req, webReq.res, webReq.next);
    const webReqId = webReq.res.getData().request._id;

    // Delete skill directly from DB
    await Skill.findByIdAndDelete(webSkill._id);

    // Direct API attempt to accept request for deleted skill
    const rogueAccept = mockReqRes(studentA, { status: 'Accepted' }, { id: webReqId.toString() });
    await updateRequestStatus(rogueAccept.req, rogueAccept.res, rogueAccept.next);
    if (rogueAccept.res.getStatusCode() !== 400 || !rogueAccept.res.getData().message.includes('deleted')) {
      throw new Error(`Rogue accept of deleted skill was not blocked: ${rogueAccept.res.getStatusCode()}`);
    }
    results.testD.steps.push('Direct API call to accept request for deleted skill strictly blocked with 400');

    // 2. Direct API call to accept request with banned student
    studentB.isBanned = true;
    await studentB.save();

    const dummySkill = await Skill.create({
      title: 'Test E2E Dummy',
      description: 'Dummy',
      category: 'Programming & Tech',
      type: 'Teaching',
      user: studentA._id,
    });
    const dummyReq = await SkillRequest.create({
      requester: studentB._id,
      recipient: studentA._id,
      skill: dummySkill._id,
      status: 'Pending',
    });

    const acceptBannedReq = mockReqRes(studentA, { status: 'Accepted' }, { id: dummyReq._id.toString() });
    await updateRequestStatus(acceptBannedReq.req, acceptBannedReq.res, acceptBannedReq.next);
    if (acceptBannedReq.res.getStatusCode() !== 400) {
      throw new Error('Rogue accept involving banned student was not blocked');
    }
    results.testD.steps.push('Direct API call to accept request involving suspended student blocked with 400');

    // 3. Verify student with no accepted connection cannot see contact info
    const nonConnectedProfile = mockReqRes(studentA, {}, { id: studentB._id.toString() });
    studentB.isBanned = false; // unban for profile test
    await studentB.save();
    await getPublicStudentProfile(nonConnectedProfile.req, nonConnectedProfile.res, nonConnectedProfile.next);
    const pData = nonConnectedProfile.res.getData().profile;
    if (pData.isConnected || pData.contactInfo.phone !== 'Protected (Visible upon accepted request)') {
      throw new Error('Contact info exposed to non-connected student');
    }
    results.testD.steps.push('Non-connected student cannot view contact info (privacy guard enforced)');
    results.testD.passed = true;
    console.log('✅ Test D Passed');

    // Cleanup
    await User.deleteMany({ email: { $regex: /^test_e2e_/ } });
    await Skill.deleteMany({ title: { $regex: /^Test E2E / } });
    await SkillRequest.deleteMany({ _id: { $in: [createdReq._id, nlpReqId, reqBId, reqCId, webReqId, dummyReq._id] } });
    console.log('[Test Suite] Cleanup complete.');

  } catch (error) {
    console.error('[Test Suite Error]', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Test Suite] Database connection closed.');
  }

  console.log('\n========================================');
  console.log('TEST SUITE EXECUTION SUMMARY');
  console.log('========================================');
  for (const [key, test] of Object.entries(results)) {
    console.log(`\n${test.name}: ${test.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
    test.steps.forEach((s) => console.log(`  • ${s}`));
  }
  console.log('========================================\n');
};

runAllTests();

