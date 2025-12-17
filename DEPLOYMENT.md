# Production Deployment Checklist

## Before Deploying

### 1. Environment Variables
- [ ] Set strong `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Configure production `DATABASE_URL` with SSL
- [ ] Update `MANAGER_PHONE` if needed

### 2. Database
- [ ] Set up production PostgreSQL database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed production database: `npm run db:seed`
- [ ] Enable SSL connections
- [ ] Set up automated backups

### 3. Security
- [ ] Change default admin password
- [ ] Review and update CORS settings
- [ ] Enable rate limiting for API routes
- [ ] Set up monitoring and error tracking
- [ ] Configure CSP headers

### 4. Performance
- [ ] Enable caching strategies
- [ ] Configure CDN for static assets
- [ ] Optimize images
- [ ] Set up database connection pooling

### 5. Testing
- [ ] Test all booking flows
- [ ] Verify authentication works
- [ ] Check mobile responsiveness
- [ ] Test calendar interactions
- [ ] Verify API endpoints
- [ ] Test error handling

## Deployment Platforms

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Connect PostgreSQL (Vercel Postgres or external)
5. Deploy

### Railway

1. Create new project
2. Add PostgreSQL plugin
3. Deploy from GitHub
4. Configure environment variables
5. Run seed command

### Docker

```bash
# Build
docker build -t turf-booking .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  turf-booking
```

## Post-Deployment

- [ ] Verify all pages load correctly
- [ ] Test login functionality
- [ ] Create a test booking
- [ ] Check error logs
- [ ] Set up uptime monitoring
- [ ] Configure SSL certificate
- [ ] Set up custom domain
- [ ] Test on multiple devices
- [ ] Set up analytics (optional)

## Maintenance

- Regular database backups
- Monitor error logs
- Update dependencies monthly
- Review and rotate secrets quarterly
- Monitor database performance
- Check disk space usage

## Support Contacts

- Database issues: Contact your database provider
- Hosting issues: Contact your hosting provider
- Application bugs: Review error logs and code
