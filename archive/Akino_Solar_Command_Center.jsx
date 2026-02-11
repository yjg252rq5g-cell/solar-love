import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = {
  navy: "#1F4E79",
  blue: "#2563EB",
  green: "#16A34A",
  red: "#DC2626",
  orange: "#EA580C",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  white: "#FFFFFF",
  yellow: "#F59E0B",
};

const TECHS = [
  { name: "Sam", role: "Technician", hourly: 25, loaded: 32.5 },
  { name: "Lucas", role: "Technician", hourly: 20, loaded: 26 },
  { name: "Katie", role: "Admin", hourly: 20, loaded: 26 },
  { name: "Spencer", role: "Technician", hourly: 40, loaded: 52 },
  { name: "Lex", role: "Job Mgmt", hourly: 30, loaded: 39 },
  { name: "Caden", role: "Owner", hourly: 28.85, loaded: 37.51 },
];

const SETTINGS = {
  fuelPerMile: 0.99,
  overheadPerJob: 2614.06,
  riskBuffer: 100,
  qaPerJob: 85,
  adminPerJob: 315,
  monthlyRunRate: 56637.88,
  annualRunRate: 679654.56,
  costPerHour: 326.76,
  breakEvenPerJob: 2614.06,
  jobsPerWeek: 5,
};

const OVERHEAD_CATEGORIES = [
  { category: "People & Payroll", monthly: 33383.05, pct: 58.9 },
  { category: "Software & Comms", monthly: 1818.80, pct: 3.2 },
  { category: "Storage & Facilities", monthly: 898.82, pct: 1.6 },
  { category: "Fleet & Insurance", monthly: 2357.73, pct: 4.2 },
  { category: "Misc / Other", monthly: 3537.34, pct: 6.2 },
  { category: "Debt & Financing", monthly: 7593.00, pct: 13.4 },
  { category: "Reserves & Taxes", monthly: 8314.98, pct: 14.7 },
  { category: "Depreciation & CapEx", monthly: 1283.33, pct: 2.3 },
  { category: "Variable Job Costs", monthly: 1925.00, pct: 3.4 },
];

const ROUTES = [
  { id: "R1", jobs: 4, miles: 372.56, driveMin: 640, value: 400 },
  { id: "R2", jobs: 4, miles: 382.10, driveMin: 655, value: 150 },
  { id: "R3", jobs: 4, miles: 501.72, driveMin: 860, value: 1433.82 },
  { id: "R4", jobs: 4, miles: 229.25, driveMin: 393, value: 1407.88 },
  { id: "R5", jobs: 4, miles: 289.38, driveMin: 497, value: 0 },
  { id: "R6", jobs: 4, miles: 333.08, driveMin: 571, value: 0 },
  { id: "R7", jobs: 4, miles: 445.59, driveMin: 764, value: 3820.20 },
  { id: "R8", jobs: 4, miles: 761.43, driveMin: 1305, value: 1146.21 },
  { id: "R9", jobs: 4, miles: 501.89, driveMin: 860, value: 1278.51 },
  { id: "R10", jobs: 4, miles: 470.11, driveMin: 805, value: 4893.62 },
  { id: "R11", jobs: 4, miles: 396.41, driveMin: 679, value: 667.50 },
  { id: "R12", jobs: 4, miles: 329.68, driveMin: 566, value: 2289.00 },
  { id: "R13", jobs: 4, miles: 156.16, driveMin: 267, value: 961.88 },
  { id: "R14", jobs: 4, miles: 46.05, driveMin: 79, value: 826.63 },
  { id: "R15", jobs: 4, miles: 130.86, driveMin: 225, value: 75 },
  { id: "R16", jobs: 4, miles: 168.70, driveMin: 289, value: 606.88 },
  { id: "R17", jobs: 4, miles: 763.69, driveMin: 1310, value: 2073.00 },
  { id: "R18", jobs: 1, miles: 731.52, driveMin: 1254, value: 600 },
];

const SAMPLE_JOBS = [
  { id: "435804", customer: "Dennis Stadler", tech: "Lucas", onsiteHrs: 1, travelHrs: 4, miles: 234, parts: 0, revenue: 150, type: "Both", date: "2026-01-05" },
  { id: "439295", customer: "Krista Hogan", tech: "Lucas", onsiteHrs: 2.5, travelHrs: 1, miles: 28, parts: 0, revenue: 450, type: "Warranty", date: "2026-01-06" },
  { id: "597", customer: "Barabra Arledge", tech: "Lucas", onsiteHrs: 3, travelHrs: 2, miles: 470, parts: 0, revenue: 3713.62, type: "Service", date: "2026-02-11" },
  { id: "628", customer: "Martha Berry", tech: "Caden", onsiteHrs: 2, travelHrs: 1.5, miles: 445, parts: 0, revenue: 1404.20, type: "Service", date: "2026-02-10" },
  { id: "649", customer: "Peter Tran", tech: "Caden", onsiteHrs: 2, travelHrs: 2, miles: 500, parts: 0, revenue: 740.82, type: "Service", date: "2026-02-17" },
  { id: "464", customer: "Mary Leffell", tech: "Sam", onsiteHrs: 1, travelHrs: 1, miles: 46, parts: 0, revenue: 394.63, type: "Service", date: "2026-02-11" },
  { id: "638", customer: "Erica Drvoldelic", tech: "Lucas", onsiteHrs: 2, travelHrs: 3, miles: 501, parts: 0, revenue: 343.50, type: "Service", date: "2026-02-19" },
  { id: "505", customer: "Amanda Darnell", tech: "Spencer", onsiteHrs: 1, travelHrs: 2, miles: 329, parts: 0, revenue: 675, type: "Service", date: "2025-12-18" },
  { id: "645", customer: "Jason Wirth", tech: "Caden", onsiteHrs: 3, travelHrs: 2, miles: 445, parts: 0, revenue: 2191.00, type: "Service", date: "2026-02-11" },
  { id: "666", customer: "Dennis Stadler", tech: "Caden", onsiteHrs: 1, travelHrs: 1.5, miles: 333, parts: 0, revenue: 75, type: "Service", date: "2026-02-11" },
  { id: "200", customer: "Jon", tech: "Caden", onsiteHrs: 2, travelHrs: 1, miles: 98, parts: 0, revenue: 676, type: "Service", date: "2026-01-15" },
  { id: "100", customer: "Heidi", tech: "Lucas", onsiteHrs: 7, travelHrs: 1, miles: 100, parts: 0, revenue: 900, type: "Service", date: "2026-01-20" },
  { id: "500", customer: "Bane", tech: "Lucas", onsiteHrs: 8, travelHrs: 4, miles: 510, parts: 0, revenue: 675, type: "Service", date: "2026-01-25" },
  { id: "410", customer: "Rivera", tech: "Lucas", onsiteHrs: 1, travelHrs: 2, miles: 372, parts: 0, revenue: 400, type: "Service", date: "2025-12-21" },
  { id: "616", customer: "Robert Makowski", tech: "Lucas", onsiteHrs: 2, travelHrs: 3, miles: 761, parts: 0, revenue: 649.50, type: "Service", date: "2026-02-11" },
];

function calcJobCost(tech, onsiteHrs, travelHrs, miles, parts, consumables = 0) {
  const techData = TECHS.find(t => t.name === tech);
  const loadedRate = techData ? techData.loaded : 30;
  const laborCost = (onsiteHrs + travelHrs) * loadedRate;
  const travelCost = miles * SETTINGS.fuelPerMile;
  const overhead = SETTINGS.overheadPerJob;
  const trueCost = laborCost + travelCost + parts + consumables + overhead;
  return { laborCost, travelCost, overhead, trueCost, loadedRate };
}

const PIE_COLORS = ["#1F4E79", "#2563EB", "#16A34A", "#EA580C", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6"];

function formatCurrency(val) {
  if (val === undefined || val === null) return "$0.00";
  const neg = val < 0;
  const abs = Math.abs(val);
  const formatted = "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return neg ? `(${formatted})` : formatted;
}

function formatPct(val) {
  return (val * 100).toFixed(1) + "%";
}

function Badge({ text, color }) {
  const bg = color === "green" ? "bg-green-100 text-green-800" : color === "red" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>{text}</span>;
}

function KPICard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color || COLORS.navy }}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: color || COLORS.navy }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function PricingCalculator() {
  const [tech, setTech] = useState("Sam");
  const [onsiteHrs, setOnsiteHrs] = useState(2);
  const [travelHrs, setTravelHrs] = useState(2);
  const [miles, setMiles] = useState(200);
  const [parts, setParts] = useState(0);
  const [consumables, setConsumables] = useState(0);
  const [offeredRevenue, setOfferedRevenue] = useState(800);

  const cost = useMemo(() => calcJobCost(tech, onsiteHrs, travelHrs, miles, parts, consumables), [tech, onsiteHrs, travelHrs, miles, parts, consumables]);
  const netProfit = offeredRevenue - cost.trueCost;
  const margin = offeredRevenue > 0 ? netProfit / offeredRevenue : 0;
  const minPrice = cost.trueCost * 1.1;
  const verdict = netProfit >= 0 ? "ACCEPT" : "REJECT";

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Technician</label>
            <select value={tech} onChange={e => setTech(e.target.value)} className={inputClass}>
              {TECHS.map(t => <option key={t.name} value={t.name}>{t.name} — ${t.loaded.toFixed(2)}/hr loaded</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Customer Offered Revenue ($)</label>
            <input type="number" value={offeredRevenue} onChange={e => setOfferedRevenue(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Onsite Hours</label>
            <input type="number" step="0.5" value={onsiteHrs} onChange={e => setOnsiteHrs(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Travel Hours</label>
            <input type="number" step="0.5" value={travelHrs} onChange={e => setTravelHrs(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Miles (round trip)</label>
            <input type="number" value={miles} onChange={e => setMiles(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Parts Cost ($)</label>
            <input type="number" value={parts} onChange={e => setParts(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Consumables ($)</label>
            <input type="number" value={consumables} onChange={e => setConsumables(+e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={`rounded-xl shadow-lg p-6 ${verdict === "ACCEPT" ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: verdict === "ACCEPT" ? COLORS.green : COLORS.red }}>
            {verdict === "ACCEPT" ? "ACCEPT — This Job Is Profitable" : "REJECT — This Job Loses Money"}
          </h2>
          <span className={`text-3xl font-black ${verdict === "ACCEPT" ? "text-green-600" : "text-red-600"}`}>
            {verdict}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">True Cost</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(cost.trueCost)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Net Profit</div>
            <div className={`text-xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(netProfit)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">Margin</div>
            <div className={`text-xl font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPct(margin)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Labor ({(onsiteHrs + travelHrs).toFixed(1)} hrs x ${cost.loadedRate.toFixed(2)})</span><span className="font-medium">{formatCurrency(cost.laborCost)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Travel ({miles} mi x ${SETTINGS.fuelPerMile})</span><span className="font-medium">{formatCurrency(cost.travelCost)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Parts</span><span className="font-medium">{formatCurrency(parts)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Consumables</span><span className="font-medium">{formatCurrency(consumables)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Overhead allocation</span><span className="font-medium">{formatCurrency(cost.overhead)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold"><span>Total True Cost</span><span>{formatCurrency(cost.trueCost)}</span></div>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <div className="text-sm font-semibold text-yellow-800">
            Minimum price to charge (10% margin): <span className="text-lg">{formatCurrency(minPrice)}</span>
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Anything below {formatCurrency(cost.trueCost)} is a guaranteed loss. Charge at least {formatCurrency(minPrice)} to cover costs + 10% profit.
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardTab() {
  const jobsWithCost = useMemo(() =>
    SAMPLE_JOBS.map(j => {
      const c = calcJobCost(j.tech, j.onsiteHrs, j.travelHrs, j.miles, j.parts);
      return { ...j, ...c, netProfit: j.revenue - c.trueCost, margin: j.revenue > 0 ? (j.revenue - c.trueCost) / j.revenue : -1 };
    }), []
  );

  const totalRevenue = jobsWithCost.reduce((s, j) => s + j.revenue, 0);
  const totalCost = jobsWithCost.reduce((s, j) => s + j.trueCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const accepted = jobsWithCost.filter(j => j.netProfit >= 0).length;
  const rejected = jobsWithCost.filter(j => j.netProfit < 0).length;

  const techPerf = TECHS.filter(t => jobsWithCost.some(j => j.tech === t.name)).map(t => {
    const jobs = jobsWithCost.filter(j => j.tech === t.name);
    return {
      name: t.name,
      jobs: jobs.length,
      revenue: jobs.reduce((s, j) => s + j.revenue, 0),
      cost: jobs.reduce((s, j) => s + j.trueCost, 0),
      profit: jobs.reduce((s, j) => s + j.netProfit, 0),
    };
  });

  const monthlyData = useMemo(() => {
    const months = {};
    jobsWithCost.forEach(j => {
      const m = j.date.slice(0, 7);
      if (!months[m]) months[m] = { month: m, revenue: 0, cost: 0, jobs: 0 };
      months[m].revenue += j.revenue;
      months[m].cost += j.trueCost;
      months[m].jobs += 1;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({ ...m, profit: m.revenue - m.cost }));
  }, [jobsWithCost]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Total Revenue" value={formatCurrency(totalRevenue)} sub={`${jobsWithCost.length} jobs entered`} color={COLORS.blue} />
        <KPICard label="Total True Cost" value={formatCurrency(totalCost)} sub={`Overhead: ${formatCurrency(SETTINGS.monthlyRunRate)}/mo`} color={COLORS.orange} />
        <KPICard label="Net Profit/Loss" value={formatCurrency(totalProfit)} sub={`Margin: ${formatPct(totalRevenue > 0 ? totalProfit / totalRevenue : 0)}`} color={totalProfit >= 0 ? COLORS.green : COLORS.red} />
        <KPICard label="Job Verdicts" value={`${accepted} Accept / ${rejected} Reject`} sub={`Acceptance rate: ${formatPct(accepted / jobsWithCost.length)}`} color={accepted > rejected ? COLORS.green : COLORS.red} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Monthly Run-Rate" value={formatCurrency(SETTINGS.monthlyRunRate)} sub="Fixed + variable overhead" color={COLORS.navy} />
        <KPICard label="Breakeven / Job" value={formatCurrency(SETTINGS.breakEvenPerJob)} sub="At 5 jobs/week" color={COLORS.navy} />
        <KPICard label="Cost Per Hour" value={formatCurrency(SETTINGS.costPerHour)} sub="173.33 work hrs/mo" color={COLORS.navy} />
        <KPICard label="Annual Run-Rate" value={formatCurrency(SETTINGS.annualRunRate)} sub="Monthly x 12" color={COLORS.navy} />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Tech Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={techPerf}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill={COLORS.blue} />
            <Bar dataKey="cost" name="True Cost" fill={COLORS.red} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Overhead Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={OVERHEAD_CATEGORIES} dataKey="monthly" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, pct }) => `${pct}%`}>
                {OVERHEAD_CATEGORIES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Monthly Revenue vs Cost</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={2} />
              <Line type="monotone" dataKey="cost" name="True Cost" stroke={COLORS.red} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function JobsTable() {
  const [sortBy, setSortBy] = useState("netProfit");
  const [sortDir, setSortDir] = useState("desc");

  const jobsWithCost = useMemo(() =>
    SAMPLE_JOBS.map(j => {
      const c = calcJobCost(j.tech, j.onsiteHrs, j.travelHrs, j.miles, j.parts);
      return { ...j, ...c, netProfit: j.revenue - c.trueCost, margin: j.revenue > 0 ? (j.revenue - c.trueCost) / j.revenue : -999 };
    }).sort((a, b) => sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]), [sortBy, sortDir]
  );

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const thClass = "px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-800";

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.navy }}>
              <th className={thClass}>Job</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Tech</th>
              <th className={thClass}>Date</th>
              <th className={thClass} onClick={() => handleSort("revenue")}>Revenue {sortBy === "revenue" ? (sortDir === "desc" ? "↓" : "↑") : ""}</th>
              <th className={thClass} onClick={() => handleSort("trueCost")}>True Cost {sortBy === "trueCost" ? (sortDir === "desc" ? "↓" : "↑") : ""}</th>
              <th className={thClass} onClick={() => handleSort("netProfit")}>Net Profit {sortBy === "netProfit" ? (sortDir === "desc" ? "↓" : "↑") : ""}</th>
              <th className={thClass}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {jobsWithCost.map((j, i) => (
              <tr key={j.id + i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2 text-sm font-medium text-gray-900">{j.id}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{j.customer}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{j.tech}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{j.date}</td>
                <td className="px-3 py-2 text-sm font-medium text-blue-700">{formatCurrency(j.revenue)}</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{formatCurrency(j.trueCost)}</td>
                <td className={`px-3 py-2 text-sm font-bold ${j.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(j.netProfit)}</td>
                <td className="px-3 py-2"><Badge text={j.netProfit >= 0 ? "ACCEPT" : "REJECT"} color={j.netProfit >= 0 ? "green" : "red"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutesTab() {
  const routeData = ROUTES.map(r => ({
    ...r,
    costPerMile: r.miles > 0 ? (r.value / r.miles) : 0,
    revenuePerJob: r.jobs > 0 ? (r.value / r.jobs) : 0,
    profitable: (r.jobs > 0 ? r.value / r.jobs : 0) >= SETTINGS.breakEvenPerJob,
  }));

  const totalValue = routeData.reduce((s, r) => s + r.value, 0);
  const totalMiles = routeData.reduce((s, r) => s + r.miles, 0);
  const totalJobs = routeData.reduce((s, r) => s + r.jobs, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Routes" value={routeData.length} sub={`${totalJobs} total jobs`} color={COLORS.navy} />
        <KPICard label="Total Route Value" value={formatCurrency(totalValue)} sub={`Avg ${formatCurrency(totalValue / routeData.length)}/route`} color={COLORS.blue} />
        <KPICard label="Total Miles" value={totalMiles.toLocaleString()} sub={`Avg ${(totalMiles / routeData.length).toFixed(0)} mi/route`} color={COLORS.orange} />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Revenue by Route</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={routeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="id" />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => typeof v === "number" ? formatCurrency(v) : v} />
            <Bar dataKey="value" name="Route Value" fill={COLORS.blue}>
              {routeData.map((r, i) => <Cell key={i} fill={r.value >= SETTINGS.breakEvenPerJob ? COLORS.green : COLORS.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-gray-500 text-center">Green = route value above breakeven threshold per job. Red = below.</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.navy }}>
              {["Route", "Jobs", "Miles", "Drive Time", "Value", "$/Job", "$/Mile"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-white uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routeData.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2 text-sm font-bold">{r.id}</td>
                <td className="px-3 py-2 text-sm">{r.jobs}</td>
                <td className="px-3 py-2 text-sm">{r.miles.toFixed(0)}</td>
                <td className="px-3 py-2 text-sm">{Math.floor(r.driveMin / 60)}h {r.driveMin % 60}m</td>
                <td className="px-3 py-2 text-sm font-medium text-blue-700">{formatCurrency(r.value)}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(r.revenuePerJob)}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(r.costPerMile)}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold border-t-2">
              <td className="px-3 py-2 text-sm">TOTAL</td>
              <td className="px-3 py-2 text-sm">{totalJobs}</td>
              <td className="px-3 py-2 text-sm">{totalMiles.toFixed(0)}</td>
              <td className="px-3 py-2 text-sm">-</td>
              <td className="px-3 py-2 text-sm text-blue-700">{formatCurrency(totalValue)}</td>
              <td className="px-3 py-2 text-sm">{formatCurrency(totalValue / totalJobs)}</td>
              <td className="px-3 py-2 text-sm">{formatCurrency(totalValue / totalMiles)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BreakEvenTab() {
  const scenarios = Array.from({ length: 15 }, (_, i) => {
    const jpw = i + 1;
    const jpm = jpw * 52 / 12;
    const overhead = SETTINGS.monthlyRunRate;
    const perJob = overhead / jpm;
    const breakeven = perJob + 100;
    return { jpw, jpm: jpm.toFixed(1), overhead, perJob, breakeven, costPerHour: overhead / 173.33 };
  });

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
        <div className="font-bold text-yellow-800 text-sm">Your current volume: ~5 jobs/week</div>
        <div className="text-yellow-700 text-sm mt-1">At this rate, each job needs to bring in at least <strong>{formatCurrency(scenarios[4].breakeven)}</strong> just to break even.</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Breakeven Revenue Per Job by Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scenarios}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="jpw" label={{ value: "Jobs/Week", position: "bottom", offset: -5 }} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Bar dataKey="breakeven" name="Breakeven/Job" fill={COLORS.navy}>
              {scenarios.map((s, i) => <Cell key={i} fill={i === 4 ? COLORS.orange : COLORS.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.navy }}>
              {["Jobs/Week", "Jobs/Month", "Monthly Overhead", "Overhead/Job", "Breakeven/Job", "Cost/Hour"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-white uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => (
              <tr key={s.jpw} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${i === 4 ? "bg-orange-50 font-bold" : ""}`}>
                <td className="px-3 py-2 text-sm">{s.jpw} {i === 4 ? "(current)" : ""}</td>
                <td className="px-3 py-2 text-sm">{s.jpm}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(s.overhead)}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(s.perJob)}</td>
                <td className="px-3 py-2 text-sm font-medium text-blue-700">{formatCurrency(s.breakeven)}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(s.costPerHour)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  { id: "pricing", label: "Job Pricing Calculator", icon: "calculator" },
  { id: "dashboard", label: "Dashboard", icon: "chart" },
  { id: "jobs", label: "Job P&L", icon: "table" },
  { id: "routes", label: "Routes", icon: "map" },
  { id: "breakeven", label: "Break-Even", icon: "target" },
];

export default function AkinoSolarCommandCenter() {
  const [activeTab, setActiveTab] = useState("pricing");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="text-white py-4 px-6" style={{ backgroundColor: COLORS.navy }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AKINO SOLAR</h1>
            <p className="text-blue-200 text-sm">Command Center</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-blue-200">Monthly Run-Rate</div>
            <div className="text-xl font-bold">{formatCurrency(SETTINGS.monthlyRunRate)}</div>
          </div>
        </div>
      </div>

      <div className="border-b bg-white shadow-sm">
        <div className="flex space-x-0 px-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {activeTab === "pricing" && <PricingCalculator />}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "jobs" && <JobsTable />}
        {activeTab === "routes" && <RoutesTab />}
        {activeTab === "breakeven" && <BreakEvenTab />}
      </div>

      <div className="text-center py-4 text-xs text-gray-400">
        Akino Solar Command Center — Data from Google Sheets consolidated on Feb 11, 2026
      </div>
    </div>
  );
}
