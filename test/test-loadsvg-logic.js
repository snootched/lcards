/**
 * Simple unit test for loadSvg() method logic
 * Tests the key derivation and source type detection
 */

// Mock logger
const lcardsLog = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

/**
 * Simulates the key determination logic from loadSvg()
 */
function determineKeyAndUrl(source) {
  if (!source || source === 'none') {
    return { key: null, url: null, shouldRegister: false };
  }

  let key;
  let url;
  let shouldRegister = false;

  if (source.startsWith('builtin:')) {
    // Builtin SVGs are pre-registered by packs
    key = source.replace('builtin:', '');
  } else if (source.startsWith('/local/') || source.startsWith('http')) {
    // External/user SVGs: derive key from filename
    key = source.split('/').pop().replace('.svg', '');
    url = source;
    shouldRegister = true;
  } else {
    // Assume it's already a registered key
    key = source;
  }

  return { key, url, shouldRegister };
}

// Test cases
console.log('=== Testing loadSvg() Key Derivation Logic ===\n');

const testCases = [
  {
    input: 'builtin:lcars_master_systems_display_002',
    expected: {
      key: 'lcars_master_systems_display_002',
      url: undefined,
      shouldRegister: false
    }
  },
  {
    input: '/local/custom.svg',
    expected: {
      key: 'custom',
      url: '/local/custom.svg',
      shouldRegister: true
    }
  },
  {
    input: '/local/my-ship-design.svg',
    expected: {
      key: 'my-ship-design',
      url: '/local/my-ship-design.svg',
      shouldRegister: true
    }
  },
  {
    input: 'https://example.com/graphics/ship.svg',
    expected: {
      key: 'ship',
      url: 'https://example.com/graphics/ship.svg',
      shouldRegister: true
    }
  },
  {
    input: 'http://cdn.example.com/path/to/graphic.svg',
    expected: {
      key: 'graphic',
      url: 'http://cdn.example.com/path/to/graphic.svg',
      shouldRegister: true
    }
  },
  {
    input: 'none',
    expected: {
      key: null,
      url: null,
      shouldRegister: false
    }
  },
  {
    input: null,
    expected: {
      key: null,
      url: null,
      shouldRegister: false
    }
  },
  {
    input: '',
    expected: {
      key: null,
      url: null,
      shouldRegister: false
    }
  },
  {
    input: 'already-registered-key',
    expected: {
      key: 'already-registered-key',
      url: undefined,
      shouldRegister: false
    }
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = determineKeyAndUrl(test.input);
  const isMatch = 
    result.key === test.expected.key &&
    result.url === test.expected.url &&
    result.shouldRegister === test.expected.shouldRegister;

  if (isMatch) {
    console.log(`✓ Test ${index + 1} PASSED: ${test.input || '(empty)'}`);
    passed++;
  } else {
    console.error(`✗ Test ${index + 1} FAILED: ${test.input || '(empty)'}`);
    console.error('  Expected:', test.expected);
    console.error('  Got:     ', result);
    failed++;
  }
});

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
