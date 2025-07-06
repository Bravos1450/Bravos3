

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Tip, Associate } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { ChartBarIcon, ChatBubbleLeftEllipsisIcon } from '../../components/icons';

type Period = 'today' | 'week' | 'month' | 'year';

const PeriodButton: React.FC<{ period: Period, label: string, selected: boolean, onClick: (period: Period) => void }> = ({ period, label, selected, onClick }) => (
    <button
        onClick={() => onClick(period)}
        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${
            selected
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-medium-text hover:bg-gray-100'
        }`}
    >
        {label}
    </button>
);

const BravosModal: React.FC<{ associate: Associate; tips: Tip[]; onClose: () => void; }> = ({ associate, tips, onClose }) => {
    // This modal only shows tips for the specific associate passed to it
    const associateBravos = tips.filter(t => t.associateId === associate.id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-dark-text">Bravos for {associate.name}</h3>
                    <p className="text-medium-text">{associate.role}</p>
                </div>
                <div className="p-6 bg-light-bg overflow-y-auto" style={{maxHeight: '60vh'}}>
                    {associateBravos.length > 0 ? (
                        <div className="space-y-4">
                            {associateBravos.map(tip => (
                                <div key={tip.id} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-dark-text">From: {tip.customerName}</p>
                                        <span className="text-xs text-light-text">{tip.timestamp.toLocaleDateString()}</span>
                                    </div>
                                    {tip.amount > 0 && <p className="text-secondary font-semibold">${tip.amount.toFixed(2)}</p>}
                                    <p className="text-medium-text mt-1 italic">"{tip.message}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-medium-text py-8">No Bravos received in this period.</p>
                    )}
                </div>
                <div className="p-4 bg-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover">Close</button>
                </div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{ title: string; value: string; subtext?: string; }> = ({ title, value, subtext }) => (
    <Card className="text-center">
        <p className="text-3xl lg:text-4xl font-bold text-primary">{value}</p>
        <h3 className="mt-1 text-sm font-semibold text-dark-text uppercase tracking-wider">{title}</h3>
        {subtext && <p className="text-xs text-medium-text mt-1">{subtext}</p>}
    </Card>
);

const CorporateReports: React.FC = () => {
    const { state } = useAppContext();
    const { currentUser } = state;
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
    const [viewingBravosFor, setViewingBravosFor] = useState<Associate | null>(null);

    const corporation = useMemo(() => {
        if (currentUser?.type !== 'corporate') return null;
        return state.corporations.find(c => c.id === currentUser.id);
    }, [state.corporations, currentUser]);
    
    const myAssociates = useMemo(() => state.associates.filter(a => a.isCorporate && a.corporateId === corporation?.id), [state.associates, corporation]);
    const myAssociateIds = useMemo(() => myAssociates.map(a => a.id), [myAssociates]);
    const allMyTips = useMemo(() => state.tips.filter(t => myAssociateIds.includes(t.associateId)), [state.tips, myAssociateIds]);

    const filteredTips = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (selectedPeriod) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        return allMyTips.filter(tip => tip.timestamp >= startDate);
    }, [allMyTips, selectedPeriod]);

    const kpiData = useMemo(() => {
        const totalBravos = filteredTips.length;
        const totalTipValue = filteredTips.reduce((sum, tip) => sum + tip.amount, 0);
        const bravosWithTips = filteredTips.filter(tip => tip.amount > 0).length;
        const averageTipAmount = bravosWithTips > 0 ? totalTipValue / bravosWithTips : 0;
        return { totalBravos, totalTipValue, bravosWithTips, averageTipAmount };
    }, [filteredTips]);

    const sortedAssociates = useMemo(() => {
        return [...myAssociates].sort((a, b) => {
            const bravosA = filteredTips.filter(t => t.associateId === a.id).length;
            const bravosB = filteredTips.filter(t => t.associateId === b.id).length;
            if (bravosB !== bravosA) return bravosB - bravosA;
            // secondary sort by tip amount
            const tipsA = filteredTips.filter(t => t.associateId === a.id).reduce((sum, tip) => sum + tip.amount, 0);
            const tipsB = filteredTips.filter(t => t.associateId === b.id).reduce((sum, tip) => sum + tip.amount, 0);
            return tipsB - tipsA;
        });
    }, [myAssociates, filteredTips]);

    const handleDownloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Associate Name,Role,Bravo Count,Total Tip Value ($)\n";

        sortedAssociates.forEach(associate => {
            const associateTips = filteredTips.filter(t => t.associateId === associate.id);
            const bravoCount = associateTips.length;
            const totalTips = associateTips.reduce((sum, tip) => sum + tip.amount, 0);
            const row = [`"${associate.name}"`, `"${associate.role}"`, bravoCount, totalTips.toFixed(2)].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bravos_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!corporation) {
        return <div className="p-8 text-center text-red-500">Error: Could not load corporation reports. Please try logging in again.</div>;
    }

    return (
        <>
            {viewingBravosFor && <BravosModal associate={viewingBravosFor} tips={filteredTips} onClose={() => setViewingBravosFor(null)} />}
            <div className="container mx-auto px-4 py-12">
                <Header title="Analytics & Reports" subtitle={`Performance data for ${corporation.name}`} icon={<ChartBarIcon className="h-8 w-8 text-indigo-600" />} />
                
                <Card className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 bg-light-bg p-2 rounded-xl">
                            <PeriodButton period="today" label="Today" selected={selectedPeriod === 'today'} onClick={setSelectedPeriod} />
                            <PeriodButton period="week" label="This Week" selected={selectedPeriod === 'week'} onClick={setSelectedPeriod} />
                            <PeriodButton period="month" label="This Month" selected={selectedPeriod === 'month'} onClick={setSelectedPeriod} />
                            <PeriodButton period="year" label="This Year" selected={selectedPeriod === 'year'} onClick={setSelectedPeriod} />
                        </div>
                        <button onClick={handleDownloadCSV} className="w-full sm:w-auto bg-secondary hover:bg-secondary-hover text-white font-semibold py-2 px-4 rounded-lg">
                            Download CSV
                        </button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KpiCard title="Total Bravos" value={kpiData.totalBravos.toLocaleString()} subtext="All tips and comments" />
                    <KpiCard title="Total Tip Value" value={`$${kpiData.totalTipValue.toFixed(2)}`} />
                    <KpiCard title="Bravos with Tips" value={kpiData.bravosWithTips.toLocaleString()} />
                    <KpiCard title="Average Tip" value={`$${kpiData.averageTipAmount.toFixed(2)}`} />
                </div>
                
                <Card>
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Associate Performance ({selectedPeriod})</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-medium-text">#</th>
                                    <th className="p-3 text-sm font-semibold text-medium-text">Associate</th>
                                    <th className="p-3 text-sm font-semibold text-medium-text text-center">Bravos</th>
                                    <th className="p-3 text-sm font-semibold text-medium-text text-right">Total Tips</th>
                                    <th className="p-3 text-sm font-semibold text-medium-text text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAssociates.map((associate, index) => {
                                    const associateTips = filteredTips.filter(t => t.associateId === associate.id);
                                    const bravoCount = associateTips.length;
                                    const totalTips = associateTips.reduce((sum, tip) => sum + tip.amount, 0);
                                    return (
                                        <tr key={associate.id} className="border-b border-gray-100 hover:bg-light-bg/50">
                                            <td className="p-3 font-semibold text-medium-text">{index + 1}</td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-3">
                                                    <img src={associate.avatarUrl} alt={associate.name} className="w-10 h-10 rounded-full"/>
                                                    <div>
                                                        <p className="font-bold text-dark-text">{associate.name}</p>
                                                        <p className="text-sm text-medium-text">{associate.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center font-semibold text-dark-text">{bravoCount}</td>
                                            <td className="p-3 text-right font-semibold text-secondary">${totalTips.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => setViewingBravosFor(associate)} title="View Bravos" className="p-2 text-medium-text hover:text-primary hover:bg-blue-100 rounded-full">
                                                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {sortedAssociates.length === 0 && <p className="text-center text-medium-text py-12">No data for this period.</p>}
                    </div>
                </Card>
                <div className="text-center mt-8">
                    <Link to="/corporate" className="text-sm font-semibold text-primary hover:underline">
                        &larr; Back to Main Dashboard
                    </Link>
                </div>
            </div>
        </>
    );
};

export default CorporateReports;