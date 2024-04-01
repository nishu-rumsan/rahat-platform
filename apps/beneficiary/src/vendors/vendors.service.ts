import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { VendorAddToProjectDto, VendorRegisterDto } from '@rahataid/extensions';
import { ProjectContants, UserRoles, VendorJobs } from '@rahataid/sdk';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { isAddress } from 'viem';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy
  ) {}

  //TODO: Fix allow duplicate users?
  async registerVendor(dto: VendorRegisterDto) {
    const role = await this.prisma.role.findFirst({
      where: { name: UserRoles.VENDOR },
    });
    if (!role) throw new Error('Role not found');
    // Add to User table
    const { service, ...rest } = dto;
    const user = await this.prisma.user.create({ data: rest });
    // Add to UserRole table
    const userRolePayload = { userId: user.id, roleId: role.id };
    await this.prisma.userRole.create({ data: userRolePayload });
    // Add to Auth table
    await this.prisma.auth.create({
      data: {
        userId: +user.id,
        service: dto.service as any,
        serviceId: dto[service.toLocaleLowerCase()],
        details: dto.extras,
      },
    });
    return user;
  }

  async assignToProject(dto: VendorAddToProjectDto) {
    const { vendorUuid, projectId } = dto;
    const vendorUser = await this.prisma.user.findUnique({
      where: { uuid: vendorUuid },
    });
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: vendorUser.id },
      include: {
        Role: {
          select: { name: true },
        },
      },
    });
    const isVendor = userRoles.some(
      (userRole) => userRole.Role.name === UserRoles.VENDOR
    );
    if (!isVendor) throw new Error('Not a vendor');
    const projectPayload = {
      uuid: vendorUuid,
      walletAddress: vendorUser.wallet,
    };

    const assigned = await this.getVendorAssignedToProject(
      vendorUuid,
      projectId
    );
    if (assigned)
      throw new RpcException(
        new BadRequestException('Vendor already assigned to the project!')
      );
    //2. Save vendor to project
    await this.prisma.projectVendors.create({
      data: {
        projectId,
        vendorId: vendorUuid,
      },
    });

    //3. sync vendor to Project
    return this.client.send(
      {
        cmd: VendorJobs.ADD_TO_PROJECT,
        uuid: projectId,
      },
      projectPayload
    );
  }

  async getVendorAssignedToProject(vendorId: string, projectId: string) {
    return this.prisma.projectVendors.findUnique({
      where: { projectVendorIdentifier: { vendorId, projectId } },
    });
  }

  async getVendor(dto) {
    const { id } = dto;

    const data = isAddress(id)
      ? await this.prisma.user.findFirst({ where: { wallet: id } })
      : await this.prisma.user.findUnique({ where: { uuid: id } });
    const projectData = await this.prisma.projectVendors.findMany({
      where: { vendorId: data.uuid },
      include: {
        Project: true,
      },
    });
    const projects = projectData.map((project) => project.Project);
    const userdata = { ...data, projects };
    return userdata;
  }

  async listVendor() {
    return paginate(this.prisma.userRole, {
      where: {
        Role: {
          name: UserRoles.VENDOR,
        },
      },
      include: {
        User: {
          include: {
            VendorProject: {
              include: {
                Project: true,
              },
            },
          },
        },
      },
    });
  }

  async listProjectVendor(dto) {
    const { projectId } = dto;
    return this.prisma.projectVendors.findMany({
      where: {
        projectId,
      },
      include: {
        Project: true,
        User: true,
      },
    });
  }
}
