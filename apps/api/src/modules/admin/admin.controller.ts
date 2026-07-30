import { Controller, Get, Patch, Post, Delete, Param, Query, Body, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity' })
  getRecentActivity(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.adminService.getRecentActivity(limit);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(page, limit, search, role, status);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  banUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.banUser(id, reason);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List reports' })
  getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getReports(page, limit, status);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Resolve or dismiss a report' })
  resolveReport(@Param('id') id: string, @Body('action') action: 'resolve' | 'dismiss') {
    return this.adminService.resolveReport(id, action);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'List blocks' })
  getBlocks(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getBlocks(page, limit);
  }

  @Delete('blocks/:id')
  @ApiOperation({ summary: 'Remove a block' })
  removeBlock(@Param('id') id: string) {
    return this.adminService.removeBlock(id);
  }

  @Get('content')
  @ApiOperation({ summary: 'List content items for review' })
  getContentItems(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getContentItems(page, limit, type, status);
  }

  @Delete('content/:id')
  @ApiOperation({ summary: 'Remove a content item' })
  removeContent(@Param('id') id: string) {
    return this.adminService.removeContent(id);
  }

  @Get('analytics/active-users')
  @ApiOperation({ summary: 'Get active users analytics' })
  getActiveUsersAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getActiveUsersAnalytics(from, to);
  }

  @Get('analytics/registrations')
  @ApiOperation({ summary: 'Get registration analytics' })
  getRegistrationAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getRegistrationAnalytics(from, to);
  }

  @Get('analytics/locations')
  @ApiOperation({ summary: 'Get location activity' })
  getLocationActivity() {
    return this.adminService.getLocationActivity();
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List announcements' })
  getAnnouncements(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAnnouncements(page, limit);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create an announcement' })
  createAnnouncement(@Body() body: any) {
    return this.adminService.createAnnouncement(body);
  }

  @Post('announcements/:id/publish')
  @ApiOperation({ summary: 'Publish an announcement' })
  publishAnnouncement(@Param('id') id: string) {
    return this.adminService.publishAnnouncement(id);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: 'Delete an announcement' })
  deleteAnnouncement(@Param('id') id: string) {
    return this.adminService.deleteAnnouncement(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  updateSettings(@Body() settings: Record<string, any>) {
    return this.adminService.updateSettings(settings);
  }
}
