import { HandleExceptionsService } from '../providers/handle-exceptions.service';

export function HandleExceptions(): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: unknown[]) {
      const service = HandleExceptionsService.getInstance();

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return await result;
        }

        return result;
      } catch (error) {
        await service.handleErrors(error);
      }
    };

    return descriptor;
  };
}
