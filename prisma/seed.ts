import {PrismaClient} from '@prisma/client';
import * as argon2 from 'argon2';
const prisma=new PrismaClient();
async function main(){
  const company=await prisma.orgUnit.upsert({where:{id:1},update:{name:'IJA Developer',unitType:'company',code:'IJA'},create:{name:'IJA Developer',unitType:'company',code:'IJA'}});
  const division=await prisma.orgUnit.upsert({where:{id:2},update:{name:'Hospitality Division',unitType:'division',code:'HOSP',parentId:company.id},create:{name:'Hospitality Division',unitType:'division',code:'HOSP',parentId:company.id}});
  const sector=await prisma.orgUnit.upsert({where:{id:3},update:{name:'Tourism Sector',unitType:'sector',code:'TOUR',parentId:division.id},create:{name:'Tourism Sector',unitType:'sector',code:'TOUR',parentId:division.id}});
  const department=await prisma.orgUnit.upsert({where:{id:4},update:{name:'Tourism Operations',unitType:'department',code:'TOPS',parentId:sector.id},create:{name:'Tourism Operations',unitType:'department',code:'TOPS',parentId:sector.id}});
  await prisma.orgUnit.upsert({where:{id:5},update:{name:'Addis Branch',unitType:'branch',code:'ADD',parentId:department.id},create:{name:'Addis Branch',unitType:'branch',code:'ADD',parentId:department.id}});
  const role=await prisma.role.upsert({where:{code:'super_admin'},update:{name:'Super Administrator'},create:{code:'super_admin',name:'Super Administrator',description:'Full system administration'}});
   const modules=['dashboard','strategy','planning','kpi','budget','budget_line','finance_entry','hr','projects','tourism','risk','compliance','procurement','assets','property','legal','research','reports','administration','currency','workplan','period','activity','sub_task','deliverable','compliance_finding','corrective_action','template','report','org_unit','employee','role','permission','setting','attachment','project_milestone','strategic_plan','theme','goal','objective','report_template','activity_template','project_template','risk_template','compliance_template','kpi_template','workplan_template','org_structure_template'];
  const actions=['view','create','edit','delete','submit','archive','approve','export','reject','close'];
  for(const resource of modules)await prisma.rolePermission.upsert({where:{roleId_resource:{roleId:role.id,resource}},update:{actions},create:{roleId:role.id,resource,actions}});
  const isProduction=process.env.NODE_ENV==='production';
  if(isProduction){
    const adminPassword=process.env.ADMIN_INIT_PASSWORD;
    if(!adminPassword||adminPassword.length<8){
      console.error('Production deployment requires ADMIN_INIT_PASSWORD environment variable (min 8 chars). Admin account not created.');
    }else{
      const passwordHash=await argon2.hash(adminPassword);
      await prisma.user.upsert({where:{username:'admin'},update:{passwordHash,fullName:'IJA System Administrator',roleId:role.id,primaryOrgUnitId:company.id,active:true},create:{username:'admin',passwordHash,fullName:'IJA System Administrator',roleId:role.id,primaryOrgUnitId:company.id}});
      console.log('Production admin created. Initial password set via ADMIN_INIT_PASSWORD.');
    }
  }else{
    const passwordHash=await argon2.hash('admin123');
    await prisma.user.upsert({where:{username:'admin'},update:{passwordHash,fullName:'IJA System Administrator',roleId:role.id,primaryOrgUnitId:company.id,active:true},create:{username:'admin',passwordHash,fullName:'IJA System Administrator',roleId:role.id,primaryOrgUnitId:company.id}});
    console.log('Seeded IJA-WPMS. Login: admin / admin123 (development only)');
  }
  if(await prisma.currency.count()===0)for(const c of [{code:'ETB',name:'Ethiopian Birr',isDefault:true},{code:'USD',name:'US Dollar'},{code:'EUR',name:'Euro'}])await prisma.currency.upsert({where:{code:c.code},update:{},create:{code:c.code,name:c.name,isDefault:c.isDefault??false}});
  for(let y=2018;y<=2027;y++)await prisma.planningYear.upsert({where:{year:y},update:{},create:{year:y,label:`${y} Planning Year`,status:y===2027?'active':'closed',startDate:new Date(`${y}-01-01`),endDate:new Date(`${y}-12-31`)}});
  const year=await prisma.planningYear.findUniqueOrThrow({where:{year:2027}});
  for(const c of [{name:'Room Revenue',entryType:'income',code:'INC-ROOM'},{name:'Food & Beverage',entryType:'income',code:'INC-FNB'},{name:'Utilities',entryType:'expense',code:'EXP-UTIL'},{name:'Maintenance',entryType:'expense',code:'EXP-MAINT'}])await prisma.financeCategory.upsert({where:{name:c.name},update:{entryType:c.entryType,code:c.code},create:c});
  for(const c of ['Plan Achievement','KPI Achievement','Quality','Timeliness','Initiative','Teamwork','Accountability'])await prisma.evaluationCriterion.upsert({where:{name_category:{name:c,category:'general'}},update:{},create:{name:c,category:'general',weight:1}});
  if(await prisma.goal.count({where:{yearId:year.id}})===0)for(const g of [{code:'G-01',name:'Increase tourism and hospitality revenue',weight:1},{code:'G-02',name:'Improve organizational service quality',weight:1},{code:'G-03',name:'Strengthen people and operational capability',weight:1}])await prisma.goal.create({data:{yearId:year.id,name:g.name,code:g.code,weight:g.weight}});
  if(await prisma.kpi.count()===0)for(const k of [{code:'REV',name:'Tourism Revenue',unit:'ETB',frequency:'annual',direction:'higher_is_better'},{code:'VIS',name:'Tourist Arrivals',unit:'count',frequency:'quarterly',direction:'higher_is_better'},{code:'SAT',name:'Customer Satisfaction',unit:'%',frequency:'quarterly',direction:'higher_is_better'},{code:'OCC',name:'Occupancy',unit:'%',frequency:'monthly',direction:'higher_is_better'}])await prisma.kpi.create({data:k});
  for(const q of [['Q1','2027-01-01','2027-03-31'],['Q2','2027-04-01','2027-06-30'],['Q3','2027-07-01','2027-09-30'],['Q4','2027-10-01','2027-12-31']])await prisma.periodDefinition.upsert({where:{yearId_periodType_periodKey:{yearId:year.id,periodType:'quarter',periodKey:q[0]}},update:{},create:{yearId:year.id,periodType:'quarter',periodKey:q[0],label:q[0],startDate:new Date(q[1]),endDate:new Date(q[2])}});
   await prisma.setting.upsert({where:{category_key:{category:'system',key:'organization_name'}},update:{value:'IJA Developer'},create:{category:'system',key:'organization_name',value:'IJA Developer',label:'Organization Name',updatedAt:new Date()}});
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());