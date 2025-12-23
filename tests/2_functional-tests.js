const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);

  let threadId;
  let replyId;
  const board = 'fcc_test'; // We will use a test board name

  // 1. Creating a new thread
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/' + board)
      .send({ text: 'Test Thread', delete_password: 'pass' })
      .end(function(err, res) {
        // Since we redirect, the status might be 200 (OK) or 302 (Found) depending on how chai handles it.
        // We just want to ensure it didn't crash.
        assert.equal(res.status, 200); 
        done();
      });
  });

  // 2. Viewing the 10 most recent threads
  test('Viewing the 10 most recent threads: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/' + board)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        // Save the ID of the thread we just created for future tests
        const thread = res.body[0]; 
        threadId = thread._id; 
        
        assert.property(thread, '_id');
        assert.property(thread, 'text');
        assert.property(thread, 'created_on');
        assert.property(thread, 'bumped_on');
        // Passwords and reports should NOT be visible
        assert.notProperty(thread, 'delete_password');
        assert.notProperty(thread, 'reported');
        done();
      });
  });

  // 3. Creating a new reply
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/' + board)
      .send({ thread_id: threadId, text: 'Test Reply', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 4. Viewing a single thread with all replies
  test('Viewing a single thread: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/' + board)
      .query({ thread_id: threadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, threadId);
        assert.property(res.body, 'replies');
        assert.isArray(res.body.replies);
        // Save reply ID for later
        replyId = res.body.replies[res.body.replies.length - 1]._id; 
        done();
      });
  });

  // 5. Deleting a reply with the incorrect password
  test('Delete reply with incorrect password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 6. Deleting a reply with the correct password
  test('Delete reply with correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 7. Reporting a reply
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/' + board)
      .send({ thread_id: threadId, reply_id: replyId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 8. Reporting a thread
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/' + board)
      .send({ thread_id: threadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 9. Deleting a thread with the incorrect password
  test('Delete thread with incorrect password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .send({ thread_id: threadId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 10. Deleting a thread with the correct password
  test('Delete thread with correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .send({ thread_id: threadId, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

});