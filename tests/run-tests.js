const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Document = require("../src/models/Document");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function buildDocument(expiryDate) {
  return new Document({
    owner: new mongoose.Types.ObjectId(),
    title: "Passport",
    category: "ID Proof",
    description: "Personal ID",
    expiryDate,
    tags: ["passport"],
    fileName: "passport.pdf",
    fileType: "application/pdf",
    fileSize: 1024,
    gridFsFileId: new mongoose.Types.ObjectId()
  });
}

test("user password hashing and validation work correctly", () => {
  const user = new User({
    fullName: "Test User",
    email: "test@example.com"
  });

  user.setPassword("Vaultify123");

  assert.equal(user.validatePassword("Vaultify123"), true);
  assert.equal(user.validatePassword("WrongPassword"), false);
});

test("user reset code can be created and cleared", () => {
  const user = new User({
    fullName: "Reset User",
    email: "reset@example.com"
  });

  user.setPassword("Vaultify123");
  const resetCode = user.createPasswordResetCode(15);

  assert.equal(user.validatePasswordResetCode(resetCode), true);

  user.clearPasswordResetCode();

  assert.equal(user.validatePasswordResetCode(resetCode), false);
});

test("document returns active status for future expiry dates", () => {
  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const document = buildDocument(futureDate);

  assert.equal(document.getExpiryStatus(), "active");
});

test("document returns expiring-soon status for near expiry dates", () => {
  const nearDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const document = buildDocument(nearDate);

  assert.equal(document.getExpiryStatus(), "expiring-soon");
});

test("document returns expired status for past expiry dates", () => {
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const document = buildDocument(pastDate);

  assert.equal(document.getExpiryStatus(), "expired");
});

async function run() {
  let passed = 0;

  for (const currentTest of tests) {
    try {
      await currentTest.fn();
      passed += 1;
      console.log(`PASS ${currentTest.name}`);
    } catch (error) {
      console.error(`FAIL ${currentTest.name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }

  if (process.exitCode) {
    console.error(`\n${passed}/${tests.length} tests passed.`);
    process.exit(process.exitCode);
  }

  console.log(`\nAll ${tests.length} tests passed.`);
}

run();
