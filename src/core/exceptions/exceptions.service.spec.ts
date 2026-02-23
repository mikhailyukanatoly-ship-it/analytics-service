import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExceptionsService } from './exceptions.service';

describe('ExceptionsService', () => {
  let service: ExceptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionsService],
    }).compile();

    service = module.get<ExceptionsService>(ExceptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('badRequestException', () => {
    it('should throw BadRequestException with message', () => {
      const data = { message: 'Bad request' };
      expect(() => service.badRequestException(data)).toThrow(BadRequestException);
      expect(() => service.badRequestException(data)).toThrow('Bad request');
    });

    it('should throw BadRequestException with object data', () => {
      const data = { message: 'Invalid input', code_error: 1001 };
      expect(() => service.badRequestException(data)).toThrow(BadRequestException);
    });
  });

  describe('internalServerErrorException', () => {
    it('should throw InternalServerErrorException with message', () => {
      const data = { message: 'Internal error' };
      expect(() => service.internalServerErrorException(data)).toThrow(
        InternalServerErrorException,
      );
      expect(() => service.internalServerErrorException(data)).toThrow('Internal error');
    });

    it('should throw InternalServerErrorException without data', () => {
      expect(() => service.internalServerErrorException()).toThrow(InternalServerErrorException);
    });
  });

  describe('forbiddenException', () => {
    it('should throw ForbiddenException with message', () => {
      const data = { message: 'Access denied' };
      expect(() => service.forbiddenException(data)).toThrow(ForbiddenException);
      expect(() => service.forbiddenException(data)).toThrow('Access denied');
    });

    it('should throw ForbiddenException without data', () => {
      expect(() => service.forbiddenException()).toThrow(ForbiddenException);
    });
  });

  describe('UnauthorizedException', () => {
    it('should throw UnauthorizedException with message', () => {
      const data = { message: 'Unauthorized access' };
      expect(() => service.UnauthorizedException(data)).toThrow(UnauthorizedException);
      expect(() => service.UnauthorizedException(data)).toThrow('Unauthorized access');
    });

    it('should throw UnauthorizedException without data', () => {
      expect(() => service.UnauthorizedException()).toThrow(UnauthorizedException);
    });
  });
});
