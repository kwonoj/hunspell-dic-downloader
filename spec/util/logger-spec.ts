//tslint:disable:no-require-imports
import { expect } from 'chai';
import loggerType = require('../../src/util/logger');

describe('logger', () => {
  let log: typeof loggerType.log;
  let enableLogger: typeof loggerType.enableLogger;

  beforeEach(() => ({ log, enableLogger } = require('../../src/util/logger')));

  it('should do nothing by default', () => {
    Object.keys(log).forEach(logLevel => expect(() => log[logLevel]('')).to.not.throw());
  });

  it('should accept log function', () => {
    const mockLogFn = jest.fn();
    enableLogger(mockLogFn);

    const message = 'message';
    const value = { value: 'value' };

    Object.keys(log).forEach(logLevel => log[logLevel](message, value));

    const mockCalls = mockLogFn.mock.calls;

    expect(mockCalls).to.have.lengthOf(7);
    expect(mockCalls).to.deep.equal([
      [message, value],
      [message, value],
      [message, value],
      [message, value],
      [message, value],
      [message, value],
      [message, value]
    ]);
  });

  it('should accept log object', () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      silly: jest.fn()
    };

    enableLogger(mockLogger);

    const message = 'message';
    const value = { value: 'value' };

    Object.keys(log).forEach(logLevel => log[logLevel](message, value));

    Object.keys(mockLogger).forEach(logLevel => {
      const mockCalls = mockLogger[logLevel].mock.calls;
      expect(mockCalls).to.have.lengthOf(1);
      expect(mockCalls[0]).to.deep.equal([message, value]);
    });
  });

  it('should accept partial log object', () => {
    const mockLogger = {
      info: jest.fn()
    };

    enableLogger(mockLogger);

    const message = 'message';
    const value = { value: 'value' };

    log.info(message, value);
    expect(() => log.silly('boo')).to.not.throw();
    expect(mockLogger.info.mock.calls).to.have.lengthOf(1);
    expect(mockLogger.info.mock.calls[0]).to.deep.equal([message, value]);
  });
});
