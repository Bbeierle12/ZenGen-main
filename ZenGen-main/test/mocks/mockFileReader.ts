import { vi } from 'vitest';

interface MockFileReaderOptions {
  simulateError?: boolean;
  delay?: number;
}

/**
 * Create a mock FileReader for testing file import functionality
 */
export function createMockFileReader(options: MockFileReaderOptions = {}): FileReader {
  const { simulateError = false, delay = 0 } = options;

  let _result: string | ArrayBuffer | null = null;
  let _error: DOMException | null = null;
  let _readyState: number = 0;

  const mockFileReader = {
    get result() {
      return _result;
    },
    get error() {
      return _error;
    },
    get readyState() {
      return _readyState;
    },

    onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
    onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
    onloadstart: null as ((event: ProgressEvent<FileReader>) => void) | null,
    onloadend: null as ((event: ProgressEvent<FileReader>) => void) | null,
    onprogress: null as ((event: ProgressEvent<FileReader>) => void) | null,
    onabort: null as ((event: ProgressEvent<FileReader>) => void) | null,

    readAsText: vi.fn(function (this: typeof mockFileReader, blob: Blob) {
      _readyState = 1; // LOADING

      const execute = () => {
        if (simulateError) {
          _readyState = 2; // DONE
          _error = new DOMException('Read error', 'NotReadableError');
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onerror?.(event);
          this.onloadend?.(event);
          return;
        }

        // Read the actual blob content if it's a mock with text
        if (blob instanceof Blob) {
          blob.text().then((text) => {
            _result = text;
            _readyState = 2; // DONE
            const event = { target: this } as ProgressEvent<FileReader>;
            this.onload?.(event);
            this.onloadend?.(event);
          }).catch(() => {
            // If blob.text() fails, use empty string
            _result = '';
            _readyState = 2;
            const event = { target: this } as ProgressEvent<FileReader>;
            this.onload?.(event);
            this.onloadend?.(event);
          });
        }
      };

      if (delay > 0) {
        setTimeout(execute, delay);
      } else {
        // Use microtask to simulate async behavior
        Promise.resolve().then(execute);
      }
    }),

    readAsArrayBuffer: vi.fn(function (this: typeof mockFileReader, blob: Blob) {
      _readyState = 1; // LOADING

      const execute = () => {
        if (simulateError) {
          _readyState = 2; // DONE
          _error = new DOMException('Read error', 'NotReadableError');
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onerror?.(event);
          this.onloadend?.(event);
          return;
        }

        blob.arrayBuffer().then((buffer) => {
          _result = buffer;
          _readyState = 2; // DONE
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onload?.(event);
          this.onloadend?.(event);
        }).catch(() => {
          _result = new ArrayBuffer(0);
          _readyState = 2;
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onload?.(event);
          this.onloadend?.(event);
        });
      };

      if (delay > 0) {
        setTimeout(execute, delay);
      } else {
        Promise.resolve().then(execute);
      }
    }),

    readAsDataURL: vi.fn(function (this: typeof mockFileReader, blob: Blob) {
      _readyState = 1; // LOADING

      const execute = () => {
        if (simulateError) {
          _readyState = 2;
          _error = new DOMException('Read error', 'NotReadableError');
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onerror?.(event);
          this.onloadend?.(event);
          return;
        }

        _result = 'data:application/octet-stream;base64,';
        _readyState = 2;
        const event = { target: this } as ProgressEvent<FileReader>;
        this.onload?.(event);
        this.onloadend?.(event);
      };

      if (delay > 0) {
        setTimeout(execute, delay);
      } else {
        Promise.resolve().then(execute);
      }
    }),

    readAsBinaryString: vi.fn(function (this: typeof mockFileReader, blob: Blob) {
      _readyState = 1;

      const execute = () => {
        if (simulateError) {
          _readyState = 2;
          _error = new DOMException('Read error', 'NotReadableError');
          const event = { target: this } as ProgressEvent<FileReader>;
          this.onerror?.(event);
          this.onloadend?.(event);
          return;
        }

        _result = '';
        _readyState = 2;
        const event = { target: this } as ProgressEvent<FileReader>;
        this.onload?.(event);
        this.onloadend?.(event);
      };

      if (delay > 0) {
        setTimeout(execute, delay);
      } else {
        Promise.resolve().then(execute);
      }
    }),

    abort: vi.fn(function (this: typeof mockFileReader) {
      if (_readyState === 1) {
        _readyState = 2;
        const event = { target: this } as ProgressEvent<FileReader>;
        this.onabort?.(event);
        this.onloadend?.(event);
      }
    }),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),

    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
  };

  return mockFileReader as unknown as FileReader;
}

/**
 * Create a mock File object
 */
export function createMockFile(content: string, name: string = 'test.json', type: string = 'application/json'): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Install mock FileReader globally
 */
export function installMockFileReader(options: MockFileReaderOptions = {}): void {
  (global as any).FileReader = vi.fn(() => createMockFileReader(options));
}
