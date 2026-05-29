'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from 'recharts';
import { BarChart3, DollarSign, Link2, Trophy } from 'lucide-react';

// Colors matching the R/ggplot viridis palette from the PDF
const FAIL_COLOR = '#3B0764';  // dark purple
const PASS_COLOR = '#EAB308';  // yellow

// Pass/fail counts by year extracted from the PDF graphs
const YEAR_DATA = [
  { year: '1980', Fail: 10, Pass: 12 },
  { year: '1982', Fail: 12, Pass: 13 },
  { year: '1984', Fail: 6,  Pass: 18 },
  { year: '1986', Fail: 2,  Pass: 22 },
  { year: '1988', Fail: 10, Pass: 31 },
  { year: '1990', Fail: 23, Pass: 21 },
  { year: '1992', Fail: 8,  Pass: 7  },
  { year: '1993', Fail: 5,  Pass: 2  },
  { year: '1994', Fail: 10, Pass: 9  },
  { year: '1996', Fail: 12, Pass: 15 },
  { year: '1998', Fail: 7,  Pass: 13 },
  { year: '2000', Fail: 11, Pass: 17 },
  { year: '2002', Fail: 3,  Pass: 7  },
  { year: '2004', Fail: 7,  Pass: 10 },
  { year: '2005', Fail: 7,  Pass: 1  },
  { year: '2006', Fail: 8,  Pass: 7  },
  { year: '2008', Fail: 8,  Pass: 10 },
  { year: '2009', Fail: 5,  Pass: 1  },
  { year: '2010', Fail: 8,  Pass: 5  },
  { year: '2012', Fail: 7,  Pass: 6  },
  { year: '2014', Fail: 3,  Pass: 5  },
  { year: '2016', Fail: 5,  Pass: 12 },
  { year: '2018', Fail: 6,  Pass: 8  },
  { year: '2020', Fail: 8,  Pass: 5  },
  { year: '2022', Fail: 4,  Pass: 3  },
  { year: '2024', Fail: 4,  Pass: 7  },
  { year: '2025', Fail: 1,  Pass: 0  },
];

// Pass/fail counts by topic category from the PDF
const CATEGORY_DATA = [
  { category: 'Insurance', Fail: 18, Pass: 4  },
  { category: 'Bonds',     Fail: 21, Pass: 42 },
  { category: 'Taxes',     Fail: 22, Pass: 21 },
  { category: 'Education', Fail: 21, Pass: 27 },
];

// Top 5 props by supporting finance from the PDF
const TOP_FINANCE = [
  { year: 2022, prop: '27', supporting: 69_118_222 },
  { year: 2025, prop: '50', supporting: 22_721_757 },
  { year: 2022, prop: '26', supporting: 20_748_796 },
  { year: 2008, prop: '94', supporting: 15_063_876 },
  { year: 2008, prop: '95', supporting: 15_063_876 },
];

// Mean supporting finance by category from the PDF
const MEAN_FINANCE = [
  { category: 'Insurance',  mean: 4_399_101 },
  { category: 'Bonds',      mean: 2_483_820 },
  { category: 'Taxes',      mean: 1_722_055 },
  { category: 'Education',  mean: 4_088_105 },
];

// Propositions by category for Similar Props tab
const PROP_CATEGORIES = [
  { label: 'Insurance', key: 'insurance', desc: '~22% historical pass rate — the lowest of any category. Industry spending typically opposes consumer-protection measures.' },
  { label: 'Bonds',     key: 'bonds',     desc: '~67% historical pass rate — voters consistently approve school and infrastructure bonds.' },
  { label: 'Taxes',     key: 'taxation',  desc: '~49% historical pass rate — roughly split, reflecting mixed appetite for new levies.' },
  { label: 'Education', key: 'education', desc: '~56% historical pass rate — school-related measures perform well, especially bond-backed ones.' },
];

export default function PredictionsPage() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
   // NEW: CSV proposition data
  // ------------------------------
  const [csvData, setCsvData] = useState<any[]>([]);

  // Dropdown selection
  const [selectedMainCategory, setSelectedMainCategory] =
    useState("Bond");

  // Load CSV once when page loads
  useEffect(() => {
    fetch("/data/propositions_by_category.csv")
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        setCsvData(parsed.data as any[]);
      });
  }, []);
  const highlightedYear = YEAR_DATA.find(d => d.year === selectedYear);
  // ------------------------------
// NEW: Proposition category data
// ------------------------------

// Main categories available in CSV
const mainCategories = Array.from(
  new Set(
    csvData
      .map(d => d.main_category)
      .filter(Boolean)
  )
).sort();

// Filter rows for selected category
const filteredCategoryData = csvData.filter(
  d => d.main_category === selectedMainCategory
);

// Pass/fail counts by subcategory
const subcategoryPassFail = Object.values(
  filteredCategoryData.reduce((acc, row) => {

    const type = row.topic_type || "Other";

    if (!acc[type]) {
      acc[type] = {
        topic_type: type,
        Pass: 0,
        Fail: 0,
      };
    }

    if (Number(row.passed) === 1) {
      acc[type].Pass += 1;
    } else {
      acc[type].Fail += 1;
    }

    return acc;

  }, {} as Record<string, any>)
);

// -------------------------------------
// Subcategory Types Over Time
// -------------------------------------

const subcategoryOverTime = Object.values(
  filteredCategoryData.reduce((acc, row) => {
    const year = String(row.Year);
    const type = row.topic_type || "Other";

    if (!acc[year]) acc[year] = { year };

    acc[year][type] = (acc[year][type] || 0) + 1;

    return acc;
  }, {} as Record<string, any>)
);

const topicTypes = Array.from(
  new Set(
    filteredCategoryData.map(
      row => row.topic_type || "Other"
    )
  )
);

// -------------------------------------
// Spending by Subcategory
// -------------------------------------

const spendingBySubtype = Object.values(
  filteredCategoryData.reduce((acc, row) => {

    const type = row.topic_type || "Other";

    if (!acc[type]) {
      acc[type] = {
        topic_type: type,
        supporting: 0,
        opposing: 0,
        count: 0
      };
    }

    acc[type].supporting += Number(row.supporting_usd || 0);
    acc[type].opposing += Number(row.opposing_usd || 0);
    acc[type].count += 1;

    return acc;

  }, {} as Record<string, any>)
).map((d: any) => ({
  topic_type: d.topic_type,
  supporting: d.supporting / d.count / 1_000_000,
  opposing: d.opposing / d.count / 1_000_000
}));

// -------------------------------------
// Top Spending Propositions
// -------------------------------------

const topSpendingProps = [...filteredCategoryData]
  .filter(row => row.total_usd)
  .sort((a, b) =>
    Number(b.total_usd) - Number(a.total_usd)
  )
  .slice(0, 10)
  .map(row => ({
    label: `${row.Year} Prop ${row["Prop Number"]}`,
    supporting:
      Number(row.supporting_usd || 0) / 1_000_000,
    opposing:
      Number(row.opposing_usd || 0) / 1_000_000,
  }));

  return (
    <div className="animate-fade-in" style={{ background: 'rgb(250 250 248)' }}>

      <section className="bg-white border-b-2 border-slate-700 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="kicker mb-3">Analytics</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Data Visualizations
            </h1>
            <p className="text-slate-600 font-serif leading-relaxed">
              California ballot proposition pass/fail rates by year and category, campaign finance data,
              and proposition statistics — based on data from 1980–2025.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="by-year" className="space-y-6">
            <TabsList className="w-full justify-start bg-white border border-slate-200 p-1 rounded-none flex-wrap h-auto">
              {[
                { value: 'by-year',     icon: BarChart3,  label: 'Pass/Fail by Year' },
                { value: 'by-category', icon: BarChart3,  label: 'Pass/Fail by Category' },
                { value: 'subcategory', icon: BarChart3, label: 'Subcategory Analysis' },
                { value: 'finance',     icon: DollarSign, label: 'Campaign Finance' },
                { value: 'similar',     icon: Link2,      label: 'Similar Props' },
                { value: 'leaderboard', icon: Trophy,     label: 'Prop Stats Leaderboard' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger key={value} value={value}
                  className="gap-2 rounded-none data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  <Icon className="h-4 w-4" />{label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── PASS / FAIL BY YEAR ── */}
            <TabsContent value="by-year">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Pass and Fail Rate of Propositions by Year
                  </h2>
                  <p className="text-sm text-slate-500 font-serif">
                    Count of California ballot measures that passed vs. failed each election year, 1980–2025.
                    Click a bar to highlight that year.
                  </p>
                </div>

                <Card className="border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Fail vs. Pass Count — All Years
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={YEAR_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}
                        onClick={(data) => {
                          if (data?.activeLabel) setSelectedYear(data.activeLabel as string);
                        }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="year" angle={-45} textAnchor="end"
                          tick={{ fontFamily: 'Georgia', fontSize: 10 }} />
                        <YAxis tick={{ fontFamily: 'Georgia', fontSize: 11 }} label={{ value: 'count', angle: -90, position: 'insideLeft', offset: 10, style: { fontFamily: 'Georgia', fontSize: 11 } }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Fail" fill={FAIL_COLOR} radius={[2, 2, 0, 0]} cursor="pointer" />
                        <Bar dataKey="Pass" fill={PASS_COLOR} radius={[2, 2, 0, 0]} cursor="pointer" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-slate-400 font-serif mt-2">
                      Dark purple = failed · Yellow = passed · Click a year for details
                    </p>
                  </CardContent>
                </Card>

                {/* Selected year detail */}
                {highlightedYear && (
                  <Card className="border border-indigo-200 bg-indigo-50">
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="kicker mb-1">{highlightedYear.year} Election</p>
                          <p className="text-2xl font-black text-slate-900"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            <span style={{ color: PASS_COLOR }}>{highlightedYear.Pass} passed</span>
                            {' '}·{' '}
                            <span style={{ color: FAIL_COLOR }}>{highlightedYear.Fail} failed</span>
                          </p>
                          <p className="text-sm text-slate-600 font-serif mt-1">
                            Pass rate: {Math.round(highlightedYear.Pass / (highlightedYear.Pass + highlightedYear.Fail) * 100)}%
                            of {highlightedYear.Pass + highlightedYear.Fail} total propositions
                          </p>
                        </div>
                        <button onClick={() => setSelectedYear(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-serif uppercase tracking-wider">
                          Clear ×
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Year grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {YEAR_DATA.map(d => {
                    const rate = Math.round(d.Pass / (d.Pass + d.Fail) * 100);
                    return (
                      <button key={d.year} onClick={() => setSelectedYear(d.year)}
                        className={`p-2 border text-center hover:border-indigo-400 transition-all ${selectedYear === d.year ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                        <p className="text-xs font-bold text-slate-700 font-serif">{d.year}</p>
                        <p className="text-xs font-serif" style={{ color: rate >= 50 ? '#16a34a' : '#dc2626' }}>
                          {rate}% pass
                        </p>
                        <p className="text-xs text-slate-400 font-serif">{d.Pass + d.Fail} props</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ── PASS / FAIL BY CATEGORY ── */}
            <TabsContent value="by-category">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Pass and Fail Rate by Topic Category
                  </h2>
                  <p className="text-sm text-slate-500 font-serif">
                    Overall pass vs. fail counts across all years for Insurance, Bonds, Taxes, and Education propositions.
                  </p>
                </div>

                {/* Combined chart */}
                <Card className="border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Fail vs. Pass Count by Category (All Years)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={CATEGORY_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" tick={{ fontFamily: 'Georgia', fontSize: 12 }} />
                        <YAxis tick={{ fontFamily: 'Georgia', fontSize: 11 }} label={{ value: 'count', angle: -90, position: 'insideLeft', offset: 10, style: { fontFamily: 'Georgia', fontSize: 11 } }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Fail" fill={FAIL_COLOR} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Pass" fill={PASS_COLOR} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-slate-400 font-serif mt-2">
                      Dark purple = failed · Yellow = passed · Based on California ballot data 1980–2025
                    </p>
                  </CardContent>
                </Card>

                {/* Individual category charts matching the PDF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CATEGORY_DATA.map(cat => (
                    <Card key={cat.category} className="border border-slate-200">
                      <CardHeader className="border-b border-slate-200 pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 font-serif">
                          {cat.category} Propositions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={[
                              { name: 'Fail', count: cat.Fail, fill: FAIL_COLOR },
                              { name: 'Pass', count: cat.Pass, fill: PASS_COLOR },
                            ]}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontFamily: 'Georgia', fontSize: 12 }} />
                            <YAxis tick={{ fontFamily: 'Georgia', fontSize: 11 }} />
                            <Tooltip formatter={(v) => [v, 'count']} />
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                              <Cell fill={FAIL_COLOR} />
                              <Cell fill={PASS_COLOR} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-500 font-serif mt-2">
                          {cat.Fail} failed · {cat.Pass} passed ·{' '}
                          {Math.round(cat.Pass / (cat.Pass + cat.Fail) * 100)}% pass rate
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── CAMPAIGN FINANCE ── */}
            <TabsContent value="finance">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Campaign Finance
                  </h2>
                  <p className="text-sm text-slate-500 font-serif">
                    Top propositions by supporting finance and average finance by category, 2002–2025.
                    Data from Cal-Access via Proposition_Data.csv.
                  </p>
                </div>

                {/* Top 5 table */}
                <Card className="border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Top 5 Highest Supporting Finance (2002–2025)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 font-serif mb-4">
                      Dollars raised by pro-passage committees only — does not include opposition spending. Individual proposition pages show total contributions from both sides.
                    </p>
                    <table className="w-full text-sm font-serif">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-widest text-xs">Year</th>
                          <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-widest text-xs">Prop Number</th>
                          <th className="text-right py-2 text-slate-500 font-semibold uppercase tracking-widest text-xs">Supporting ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {TOP_FINANCE.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-3 text-slate-700">{row.year}</td>
                            <td className="py-3 text-slate-700">{row.prop}</td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              ${row.supporting.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Mean finance by category */}
                <Card className="border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Average Supporting Finance by Category (2002–2025)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={MEAN_FINANCE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" tick={{ fontFamily: 'Georgia', fontSize: 12 }} />
                        <YAxis tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`}
                          tick={{ fontFamily: 'Georgia', fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Mean Supporting']} />
                        <Bar dataKey="mean" fill="#4f46e5" radius={[2, 2, 0, 0]} name="Mean Supporting" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {MEAN_FINANCE.map(row => (
                        <div key={row.category} className="bg-slate-50 border border-slate-200 p-3 text-center">
                          <p className="text-xs text-slate-400 font-serif uppercase tracking-widest mb-1">{row.category}</p>
                          <p className="font-bold text-slate-900 font-serif">${(row.mean / 1_000_000).toFixed(2)}M</p>
                          <p className="text-xs text-slate-400 font-serif">avg support</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 font-serif mt-3">
                      Source: Cal-Access campaign finance records · Mean of supporting committee totals per proposition
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* ==SUBCATEGORY ANALYSIS== */}
            <TabsContent value="subcategory">
              <div className="space-y-6">
                <div>
                  <h2
                  className="text-2xl font-black text-slate-900 mb-1"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif"
                  }}
                  >
                    Proposition Subcategory Analysis
                  </h2>

                  <p className="text-sm text-slate-500 font-serif">
                    Explore proposition performance
                    within each topic category.
                  </p>
                </div>

                <Card className="border border-slate-200">

                  <CardHeader className="border-b border-slate-200">

                    <CardTitle
                      className="text-lg font-bold text-slate-900"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif"
                      }}
                    >
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                <CardContent className="pt-6">
                  {/* Category Dropdown */}
                  <select
                    value={selectedMainCategory}
                    onChange={(e) =>
                      setSelectedMainCategory(e.target.value)
                    }
                    className="
                      border border-slate-300
                      bg-white
                      px-3 py-2
                      mb-6
                      font-serif
                      text-sm
                    "
                  >
                    {mainCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>))}
        </select>

        {/* Pass / Fail Chart */}

        <ResponsiveContainer width="100%" height={350}>

          <BarChart
            data={subcategoryPassFail}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 150
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="topic_type"
              angle={-35}
              textAnchor="end"
              interval={0}
            />

            <YAxis />

            <Tooltip />

            <Legend
  verticalAlign="top"
  align="right"
/>

            <Bar
              dataKey="Fail"
              fill={FAIL_COLOR}
            />

            <Bar
              dataKey="Pass"
              fill={PASS_COLOR}
            />

          </BarChart>

        </ResponsiveContainer>

      </CardContent>

    </Card>
<Card className="border border-slate-200">
  <CardHeader className="border-b border-slate-200">
    <CardTitle className="text-lg font-bold text-slate-900 font-serif">
      Subcategory Types Over Time
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={subcategoryOverTime} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" angle={-45} textAnchor="end" />
        <YAxis />
        <Tooltip />
        <Legend
  verticalAlign="bottom"
  wrapperStyle={{
    paddingTop: "40px"
  }}
/>

        {topicTypes.map((type, i) => (
          <Bar
            key={type}
            dataKey={type}
            stackId="a"
            fill={`hsl(${(i * 45) % 360}, 60%, 45%)`}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
<Card className="border border-slate-200">
  <CardHeader className="border-b border-slate-200">
    <CardTitle className="text-lg font-bold text-slate-900 font-serif">
      Average Campaign Spending by Subcategory
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
  layout="vertical"
  data={spendingBySubtype}
>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <YAxis
  type="category"
  dataKey="topic_type"
  width={220}
/>
<XAxis
  type="number"
  tickFormatter={(value) => `$${value.toFixed(0)}M`}
/>
        <Tooltip
  formatter={(value: number) =>
    `$${value.toFixed(2)}M`
  }
/>
        <Legend />
        <Bar dataKey="supporting" fill={PASS_COLOR} name="Supporting Average" />
        <Bar dataKey="opposing" fill={FAIL_COLOR} name="Opposing Average" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
<Card className="border border-slate-200">
  <CardHeader className="border-b border-slate-200">
    <CardTitle className="text-lg font-bold text-slate-900 font-serif">
      Top 10 Most Expensive Propositions
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={topSpendingProps} margin={{ top: 20, right: 30, left: 10, bottom: 100 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" angle={-45} textAnchor="end" height={140} />
        <YAxis tickFormatter={(v) => `$${v}M`} />
        <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}M`} />
        <Legend />
        <Bar dataKey="supporting" stackId="a" fill={PASS_COLOR} name="Supporting" />
        <Bar dataKey="opposing" stackId="a" fill={FAIL_COLOR} name="Opposing" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
  </div>

</TabsContent>
            {/* ── SIMILAR PROPS ── */}
            <TabsContent value="similar">
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Propositions by Category
                  </h2>
                  <p className="text-sm text-slate-500 font-serif">
                    Measures in the same category share historical pass-rate patterns and thematic similarity.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROP_CATEGORIES.map(cat => {
                    const match = CATEGORY_DATA.find(c => c.category.toLowerCase() === cat.label.toLowerCase());
                    const passRate = match ? Math.round(match.Pass / (match.Pass + match.Fail) * 100) : null;
                    return (
                      <Card key={cat.key} className="border border-slate-200">
                        <CardHeader className="border-b border-slate-200 pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-900 font-serif">
                              {cat.label}
                            </CardTitle>
                            {passRate !== null && (
                              <span className={`text-xs font-bold px-2 py-0.5 font-serif ${passRate >= 50 ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'}`}>
                                {passRate}% pass rate
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-3">
                          <p className="text-sm text-slate-600 font-serif leading-relaxed mb-3">{cat.desc}</p>
                          <Link href="/propositions"
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-serif uppercase tracking-wider transition-colors">
                            Browse {cat.label} propositions →
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ── LEADERBOARD ── */}
            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Prop Stats Leaderboard
                  </h2>
                  <p className="text-sm text-slate-500 font-serif">
                    Key statistics across all years of California ballot proposition data.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Years of Data', value: '1980–2025' },
                    { label: 'Total Propositions', value: `${YEAR_DATA.reduce((s, d) => s + d.Pass + d.Fail, 0)}` },
                    { label: 'Total Passed', value: `${YEAR_DATA.reduce((s, d) => s + d.Pass, 0)}`, color: 'text-emerald-700' },
                    { label: 'Total Failed', value: `${YEAR_DATA.reduce((s, d) => s + d.Fail, 0)}`, color: 'text-rose-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-slate-200 p-5 text-center">
                      <p className={`text-3xl font-black mb-1 ${color || 'text-slate-900'}`}
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {value}
                      </p>
                      <p className="text-xs text-slate-500 font-serif uppercase tracking-wide">{label}</p>
                    </div>
                  ))}
                </div>

                <Card className="border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-lg font-bold text-slate-900"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Highest Pass Rate Years
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="divide-y divide-slate-100">
                      {[...YEAR_DATA]
                        .filter(d => d.Pass + d.Fail >= 5)
                        .sort((a, b) => {
                          const rateA = a.Pass / (a.Pass + a.Fail);
                          const rateB = b.Pass / (b.Pass + b.Fail);
                          return rateB - rateA;
                        })
                        .slice(0, 10)
                        .map((d, i) => {
                          const rate = Math.round(d.Pass / (d.Pass + d.Fail) * 100);
                          return (
                            <div key={d.year} className="flex items-center gap-4 py-3 px-2 -mx-2">
                              <span className="text-2xl font-black text-slate-200 w-8 text-center shrink-0"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                {i + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-semibold font-serif text-slate-900">{d.year} Election</p>
                                <p className="text-xs text-slate-400 font-serif">
                                  {d.Pass} passed · {d.Fail} failed · {d.Pass + d.Fail} total
                                </p>
                              </div>
                              <div className="h-2 w-32 bg-slate-100 overflow-hidden">
                                <div className="h-full" style={{ width: `${rate}%`, background: PASS_COLOR }} />
                              </div>
                              <span className="text-sm font-bold font-serif text-emerald-700 w-12 text-right">
                                {rate}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </section>

    </div>
  );
}
