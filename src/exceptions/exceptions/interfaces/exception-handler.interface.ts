export abstract class ExceptionHandler {
  abstract isType(error: unknown): Record<string, unknown> | null;
  abstract execute(error: unknown): never;

  getStackTrace(error: Error): {
    className: string | undefined;
    methodName: string | undefined;
    file: string | undefined;
    line: number | undefined;
  }[] {
    const stackLines = error.stack.split('\n').slice(1);

    const stackTrace = stackLines.map((lines) => {
      const match = lines.match(
        /at\s+(?:(?<classMethod>[^\s]+)\s+\()?((?<file>[^:]+):(?<line>\d+):(?<column>\d+))\)?/,
      );

      if (!match) {
        return {
          className: undefined,
          methodName: undefined,
          file: undefined,
          line: undefined,
        };
      }

      const { classMethod, file, line } = match.groups || {};

      const [className, methodName] = (classMethod || '').split('.');

      return {
        className: className || undefined,
        methodName: methodName || undefined,
        file,
        line: line ? parseInt(line, 10) : undefined,
      };
    });

    return stackTrace;
  }
}
