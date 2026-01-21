import React from 'react';
import { Check, X, ArrowUpRight, Link2, Users, PieChart, Sparkles } from 'lucide-react';
import Card from '../../ui/Card';

const PlansComparison = () => {
    const features = [
        {
            name: "Unlimited Trader Invites",
            normal: true,
            advanced: true,
            description: "No limit on the number of personal traders you can invite."
        },
        {
            name: "Multi-level Trader Rewards",
            normal: true,
            advanced: true,
            description: "Earn rewards when your traders refer other traders."
        },
        {
            name: "Standard Commission Structure",
            normal: true,
            advanced: true,
            description: "Reliable and transparent standard commission rates."
        },
        {
            name: "Direct Trader Focus",
            normal: true,
            advanced: true,
            description: "Perfect for partners focusing on personal trader recruitment."
        },
        {
            name: "Sub-IB Management",
            normal: false,
            advanced: true,
            description: "Advanced tools to manage and structure your sub-IB network."
        },
        {
            name: "Custom IB Links",
            normal: false,
            advanced: true,
            description: "Ability to create unique links with custom commission structures."
        },
        {
            name: "Customizable Rebates",
            normal: false,
            advanced: true,
            description: "Set specific rebate levels for different sub-IB chains."
        }
    ];

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Master IB Plan Comparison
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Choose the plan that best fits your business strategy. High-volume partners often benefit from our Advanced Plan features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Normal Plan Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:border-blue-100 group">
                    <div className="p-8 bg-blue-50/50 border-b border-blue-50">
                        <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter mb-4">
                            Step 1
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Normal Plan</h3>
                        <p className="text-gray-500 text-sm mt-2">Best for building direct-to-trader networks with tiered pip structures.</p>
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                        <ul className="space-y-4">
                            {features.filter(f => f.normal).map((f, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-600">
                                    <div className="shrink-0 h-5 w-5 bg-green-100 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span>{f.name}</span>
                                </li>
                            ))}
                            {features.filter(f => !f.normal).map((f, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300">
                                    <div className="shrink-0 h-5 w-5 bg-gray-50 rounded-full flex items-center justify-center">
                                        <X className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="line-through">{f.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-8 mt-auto border-t border-gray-50">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Basic set of tools to start your journey as a Master IB. Standard referral system enabled.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Advanced Plan Card */}
                <div className="bg-white rounded-3xl border-2 border-purple-500 shadow-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 relative">
                    <div className="absolute top-0 right-0 p-4">
                        <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <div className="p-8 bg-purple-50 border-b border-purple-100">
                        <div className="inline-flex px-3 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter mb-4 shadow-lg shadow-purple-600/20">
                            Pro Version
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Advanced Plan</h3>
                        <p className="text-gray-500 text-sm mt-2">For serious partners building large sub-IB networks with custom structures.</p>
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                        <ul className="space-y-4">
                            {features.map((f, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                                    <div className="shrink-0 h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <span>{f.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-8 mt-auto border-t border-purple-50 bg-purple-50/30">
                        <div className="p-4 bg-white rounded-2xl border border-purple-100">
                            <p className="text-xs text-purple-700 leading-relaxed font-bold italic">
                                "The Advanced Plan is the only plan that allows you to create Custom IB Links with tailored rebate structures for your network."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Details */}
            <Card title="Detailed Feature Breakdown" className="max-w-5xl mx-auto shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase">Feature</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase text-center">Normal</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase text-center">Advanced</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {features.map((f, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-5 px-6">
                                        <p className="text-sm font-bold text-gray-800">{f.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                                    </td>
                                    <td className="py-5 px-6 text-center">
                                        {f.normal ? (
                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                        )}
                                    </td>
                                    <td className="py-5 px-6 text-center">
                                        {f.advanced ? (
                                            <Check className="w-5 h-5 text-purple-600 mx-auto" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default PlansComparison;
