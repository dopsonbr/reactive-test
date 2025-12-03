/**
 * Structured logging utilities for CI scripts
 */

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const ICONS = {
  pass: '✓',
  fail: '✗',
  skip: '○',
  run: '▶',
  info: 'ℹ',
  warn: '⚠',
  error: '✗',
  time: '⏱',
  arrow: '→',
  bullet: '•',
  check: '✓',
};

// Detect if colors should be used
const useColors = process.stdout.isTTY && !process.env.NO_COLOR;

function colorize(color, text) {
  if (!useColors) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function icon(name) {
  return ICONS[name] || '';
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

/**
 * Format a timestamp
 */
function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

/**
 * Logger class for structured CI output
 */
export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.ciMode = options.ci || false;
    this.startTime = Date.now();
  }

  // Basic output
  log(message) {
    console.log(message);
  }

  // Blank line
  blank() {
    console.log('');
  }

  // Header for major sections
  header(title) {
    const line = '═'.repeat(60);
    this.blank();
    this.log(colorize('cyan', line));
    this.log(colorize('cyan', colorize('bold', `  ${title}`)));
    this.log(colorize('cyan', line));
  }

  // Subheader for steps
  step(number, total, title) {
    const line = '─'.repeat(56);
    this.blank();
    this.log(colorize('blue', `  ${line}`));
    this.log(colorize('blue', colorize('bold', `  Step ${number}/${total}: ${title}`)));
    this.log(colorize('blue', `  ${line}`));
  }

  // Info message
  info(message) {
    this.log(`  ${colorize('blue', icon('info'))} ${message}`);
  }

  // Warning message
  warn(message) {
    this.log(`  ${colorize('yellow', icon('warn'))} ${colorize('yellow', message)}`);
  }

  // Error message
  error(message) {
    this.log(`  ${colorize('red', icon('error'))} ${colorize('red', message)}`);
  }

  // Success message
  success(message) {
    this.log(`  ${colorize('green', icon('pass'))} ${colorize('green', message)}`);
  }

  // Running indicator
  running(message) {
    this.log(`  ${colorize('cyan', icon('run'))} ${message}`);
  }

  // Detail line (indented)
  detail(message) {
    this.log(`      ${colorize('gray', message)}`);
  }

  // Bullet point
  bullet(message) {
    this.log(`    ${colorize('gray', icon('bullet'))} ${message}`);
  }

  // Pass result
  pass(label, duration) {
    const time = duration ? colorize('gray', ` (${formatDuration(duration)})`) : '';
    this.log(`  ${colorize('green', `[PASS]`)} ${label}${time}`);
  }

  // Fail result
  fail(label, duration) {
    const time = duration ? colorize('gray', ` (${formatDuration(duration)})`) : '';
    this.log(`  ${colorize('red', `[FAIL]`)} ${colorize('red', label)}${time}`);
  }

  // Skip result
  skip(label, reason) {
    const reasonText = reason ? colorize('gray', ` (${reason})`) : '';
    this.log(`  ${colorize('yellow', `[SKIP]`)} ${colorize('yellow', label)}${reasonText}`);
  }

  // Command being executed
  command(cmd) {
    if (this.verbose) {
      this.log(`  ${colorize('gray', '$')} ${colorize('dim', cmd)}`);
    }
  }

  // Time tracking
  time(label) {
    this.log(`  ${colorize('gray', icon('time'))} ${colorize('gray', label)}: ${colorize('cyan', formatDuration(Date.now() - this.startTime))}`);
  }

  // Summary table
  summary(results) {
    const line = '═'.repeat(60);
    this.blank();
    this.log(colorize('cyan', line));
    this.log(colorize('cyan', colorize('bold', '  Verification Summary')));
    this.log(colorize('cyan', line));
    this.blank();

    // Calculate column widths
    const maxLabel = Math.max(...results.map(r => r.label.length));

    for (const result of results) {
      const status = result.status === 'pass'
        ? colorize('green', '[PASS]')
        : result.status === 'skip'
        ? colorize('yellow', '[SKIP]')
        : colorize('red', '[FAIL]');

      const label = result.label.padEnd(maxLabel);
      const duration = result.duration
        ? colorize('gray', formatDuration(result.duration).padStart(8))
        : ''.padStart(8);

      this.log(`  ${status} ${label}  ${duration}`);
    }

    this.blank();

    // Totals
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const total = results.length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    this.log(colorize('gray', `  ${'─'.repeat(56)}`));

    const statsLine = [
      colorize('green', `${passed} passed`),
      failed > 0 ? colorize('red', `${failed} failed`) : null,
      skipped > 0 ? colorize('yellow', `${skipped} skipped`) : null,
      colorize('gray', `${total} total`),
    ].filter(Boolean).join(colorize('gray', ' | '));

    this.log(`  ${statsLine}`);
    this.log(`  ${colorize('gray', `Total time: ${formatDuration(totalDuration)}`)}`);
    this.blank();

    // Final verdict
    if (failed > 0) {
      this.log(colorize('red', colorize('bold', `  ${icon('fail')} Verification FAILED - do not merge`)));
    } else {
      this.log(colorize('green', colorize('bold', `  ${icon('pass')} All checks passed - ready to merge`)));
    }
    this.blank();
    this.log(colorize('cyan', line));
    this.blank();
  }

  // Detailed failure report
  failureReport(failures) {
    if (failures.length === 0) return;

    this.blank();
    this.log(colorize('red', colorize('bold', '  Failure Details')));
    this.log(colorize('red', '  ' + '─'.repeat(56)));

    for (const failure of failures) {
      this.blank();
      this.log(`  ${colorize('red', icon('fail'))} ${colorize('red', colorize('bold', failure.label))}`);

      if (failure.message) {
        this.log(`    ${colorize('gray', failure.message)}`);
      }

      if (failure.fix) {
        this.log(`    ${colorize('yellow', 'Fix:')} ${failure.fix}`);
      }

      if (failure.docs) {
        this.log(`    ${colorize('blue', 'Docs:')} ${failure.docs}`);
      }
    }
    this.blank();
  }
}

export { formatDuration, colorize, icon };
