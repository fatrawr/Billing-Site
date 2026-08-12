from sqlalchemy import Column, String, Date, Time, Integer, Numeric, Boolean, DateTime
from database import Base


class SignUpTbl(Base):
    """Maps 1:1 onto the SignUp_Tbl table your EF Core migrations already created.
    Do NOT run Base.metadata.create_all() for this table - it already exists."""
    __tablename__ = "WSignUp_Tbl"

    UserID     = Column(String(10), primary_key=True)
    Name       = Column(String(30), nullable=False)
    Email      = Column(String(100), nullable=False)
    Department = Column(String(50), nullable=False)
    Password   = Column(String(200), nullable=False)   # bcrypt hash, same format as BCrypt.Net
    Date       = Column(Date, nullable=False)
    Time       = Column(Time, nullable=False)

    def to_dict(self):
        return {
            "userId": self.UserID,
            "name": self.Name,
            "email": self.Email,
            "department": self.Department,
            "date": self.Date.isoformat() if self.Date else None,
        }

class PasswordResetTbl(Base):
    __tablename__ = "WPasswordReset_Tbl"
    UserID     = Column(String(15), primary_key=True)
    Code       = Column(String(6), nullable=True)
    ExpiresAt  = Column(DateTime, nullable=True)
    ResetToken = Column(String(64), nullable=True)
    Verified   = Column(Boolean, default=False)

class ConsumerTbl(Base):
    """Maps onto Consumer_Tbl. Columns inferred from BillForm.cs/BillRender.cs usage
    (ReferenceNo, Name, Address, ConnectionDate, State) - please verify column
    names/types against your actual EF Core model, this file wasn't provided."""
    __tablename__ = "WConsumer_Tbl"
 
    ReferenceNo    = Column(Integer, primary_key=True, autoincrement=False)
    Name           = Column(String(30), nullable=False)
    Address        = Column(String(100), nullable=False)
    ConnectionDate = Column(Date, nullable=True)
    State          = Column(String(1), nullable=False, default="N")
    Bill_MF        = Column(Numeric(4, 2), nullable=True)
    UserID         = Column(String(15), nullable=True)
    Date           = Column(Date, nullable=False)
    Time           = Column(Time, nullable=False)
 
 
class MeterDetailTbl(Base):
    """Maps onto MeterDetail_Tbl. Inferred - please verify. Note the original
    C# query (`FirstOrDefault(m => m.ReferenceNo == refNo)`) does NOT filter
    by an active/state flag despite your notes mentioning only one active
    meter per consumer - kept identical here rather than silently adding a
    filter that could change which meter gets picked."""
    __tablename__ = "WMeterDetail_Tbl"
 
    MeterNumber    = Column(Integer, primary_key=True, autoincrement=False)
    ReferenceNo    = Column(Integer, nullable=False)
    Status         =Column(String(1), nullable=False, default="A")    
    Residential    = Column(String(5), nullable=True)   # "R" | "SC" | "C"
    SizePlot       = Column(String(5), nullable=True)   # "2K" | "1K" | "10M"
    Phase          = Column(String(2), nullable=True)   # "1" | "3"
    Initial_Reading = Column(Integer, nullable=True)
    UserID         = Column(String(15), nullable=True)
    Date           = Column(Date, nullable=False)
    Time           = Column(Time, nullable=False)
 
 
class MasterTbl(Base):
    """Maps onto Master_Tbl. Inferred from BillRender.cs field usage - please
    verify against your actual EF Core model (especially PaymentDate's type)."""
    __tablename__ = "WMaster_Tbl"
 
    ReferenceNo           = Column(Integer, primary_key=True)
    Yyyymm                = Column(Integer, primary_key=True)
    MeterNumber            = Column(Integer, nullable=False)
    Units                 = Column(Integer, nullable=False, default=0)
    Prev_Rdg              = Column(Integer, nullable=True)
    Curr_Rdg              = Column(Integer, nullable=True)
    Unit_Rate             = Column(Numeric(6, 3), nullable=True)
    Elcty_Amnt            = Column(Numeric(10, 0), nullable=True)
    Socty_Chgs            = Column(Numeric(10, 0), nullable=True)
    Arrears               = Column(Numeric(10, 0), nullable=True)
    Om_Chgs               = Column(Numeric(10, 0), nullable=True)
    Tot_Bill_Amnt         = Column(Numeric(10, 0), nullable=False, default=0)
    Lp_Srchg              = Column(Numeric(10, 0), nullable=True)
    Bill_Amnt_Aftr_Due_Dt = Column(Numeric(10, 0), nullable=True)
    Paid_Unpaid           = Column(String(1), nullable=True)  # 'Y' | 'N'
    Payment_Made          = Column(Numeric(10, 0), nullable=True)
    PaymentDate           = Column(Date, nullable=True)
    Rdg_Posting           = Column(String(15), nullable=False)
    Pmt_Posting           = Column(String(15), nullable=False)
    Rdg_P_Date            = Column(Date, nullable=False)
    Pmt_P_Date            = Column(Date, nullable=False)
    # Date                  = Column(Date, nullable=False)
    # Time                  = Column(Time, nullable=False)
 
 
class ConfigTbl(Base):
    """Maps onto Config_Tbl. Corrected from ConfigForm.cs - composite PK of
    (Month, ConfigCode), e.g. Month=202606 ConfigCode='OM'. Note: the OM-rate
    lookup in bills_routes.py filters by ConfigCode only (no Month), exactly
    matching BillForm.cs's own `FirstOrDefault(c => c.ConfigCode == "OM")` -
    if you have configs for multiple months this will pick whichever one the
    DB returns first, same ambiguity that exists in the original."""
    __tablename__ = "WConfig_Tbl"
 
    Month       = Column(Integer, primary_key=True, autoincrement=False)  # YYYYMM
    ConfigCode  = Column(String(2), primary_key=True)
    ConfigDesc  = Column(String(100), nullable=False)
    ConfigValue = Column(Numeric(6, 3), nullable=False)
    UserID      = Column(String(15), nullable=True)
    Date        = Column(Date, nullable=True)
    Time        = Column(Time, nullable=True)
 
    def to_dict(self):
        return {
            "month": self.Month,
            "configCode": self.ConfigCode,
            "configDesc": self.ConfigDesc,
            "configValue": float(self.ConfigValue),
        }
 
class BankInfoTbl(Base):
    """Maps onto BankInfo_Tbl. Inferred - please verify."""
    __tablename__ = "WBankInfo_Tbl"
 
    Id        = Column(Integer, primary_key=True, autoincrement=True)
    BankName  = Column(String(100), nullable=False)
    AccountNo = Column(Integer, nullable=False)
    State     = Column(String(1), nullable=False, default=" ")
    UserID    = Column(String(15), nullable=True)
    Date      = Column(Date, nullable=True)
    Time      = Column(Time, nullable=True)
 
    def to_dict(self):
        return {"id": self.Id, "bankName": self.BankName, "accountNo": self.AccountNo}


class StaffPhoneTbl(Base):
    """Maps 1:1 onto StaffPhone_Tbl."""
    __tablename__ = "WStaffPhone_Tbl"

    Id          = Column(Integer, primary_key=True, autoincrement=True)
    StaffName   = Column(String(100), nullable=False)
    PhoneNumber = Column(String(20), nullable=False)
    State       = Column(String(1), nullable=False, default=" ")  # ' ' active, 'D' deleted
    UserID      = Column(String(15), nullable=True)
    Date        = Column(Date, nullable=True)
    Time        = Column(Time, nullable=True)

    def to_dict(self):
        return {
            "id": self.Id,
            "staffName": self.StaffName,
            "phoneNumber": self.PhoneNumber,
        }


class DatesTbl(Base):
    """Maps 1:1 onto Dates_Tbl. Month is stored as an int in YYYYMM form
    (e.g. 202501 for Jan 2025) and is the primary key - matches the C# form's
    delete-then-insert pattern whenever the month itself changes."""
    __tablename__ = "WDates_Tbl"

    Month  = Column(Integer, primary_key=True, autoincrement=False)
    rdg_dt = Column(Date, nullable=False)
    iss_dt = Column(Date, nullable=False)
    due_dt = Column(Date, nullable=False)
    UserID = Column(String(15), nullable=True)
    Date   = Column(Date, nullable=True)
    Time   = Column(Time, nullable=True)


class SoctyChargsTbl(Base):
    """Maps 1:1 onto SoctyChargs_Tbl. One row per (Description, Category) pair -
    e.g. 'Security' has up to 3 rows: one each for 2K / 1K / 10M categories."""
    __tablename__ = "WSoctyChargs_Tbl"

    Id          = Column(Integer, primary_key=True, autoincrement=True)
    Description = Column(String(100), nullable=False)
    Amount      = Column(Integer, nullable=False)
    Category    = Column(String(10), nullable=False)   # "2K" | "1K" | "10M"
    State       = Column(String(1), nullable=False, default=" ")  # ' ' active, 'D' deleted
    UserID      = Column(String(15), nullable=True)
    Date        = Column(Date, nullable=True)
    Time        = Column(Time, nullable=True)

    def to_dict(self):
        return {
            "id": self.Id,
            "description": self.Description,
            "amount": self.Amount,
            "category": self.Category,
        }
    


class PaymentTbl(Base):
    """Maps onto Payment_Tbl - confirmed against PaymentForm.cs/PaymentPosting.cs/PSeeder.cs."""
    __tablename__ = "WPayment_Tbl"
 
    ReferenceNo = Column(Integer, primary_key=True, autoincrement=False)
    YYMM        = Column(Integer, nullable=False)
    PaymentDue  = Column(Numeric(10, 0), nullable=False)
    PaymentMade = Column(Numeric(10, 0), nullable=False, default=0)
    PaymentDate = Column(Date, nullable=True)
 
 
class ReadingTbl(Base):
    __tablename__ = "WReading_Tbl"
    ReferenceNo = Column(Integer, primary_key=True, autoincrement=False)
    YYMM        = Column(Integer, nullable=False)
    PrevRdg     = Column(Integer, nullable=False)
    CurrRdg     = Column(Integer, nullable=True)
    Units       = Column(Integer, nullable=True)
 