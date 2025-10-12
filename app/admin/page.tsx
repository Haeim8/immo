"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Settings as SettingsIcon,
  BarChart3,
  Clock,
  CheckCircle2
} from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import BlurBackground from "@/components/atoms/BlurBackground";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import { mockInvestments, mockMetrics } from "@/lib/mock-data";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "properties" | "create" | "investors" | "dividends">("overview");

  return (
    <div className="min-h-screen">
      <Navbar />
      <BlurBackground />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-5xl font-bold">
                  <GradientText from="from-purple-400" to="to-pink-600">
                    Admin Dashboard
                  </GradientText>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage the entire platform
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="p-2">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: "overview", label: "Overview", icon: BarChart3 },
                  { id: "properties", label: "Properties", icon: Building2 },
                  { id: "create", label: "Create New", icon: Plus },
                  { id: "investors", label: "Investors", icon: Users },
                  { id: "dividends", label: "Dividends", icon: DollarSign },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                        : "hover:bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Content */}
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "properties" && <PropertiesTab />}
          {activeTab === "create" && <CreatePropertyTab />}
          {activeTab === "investors" && <InvestorsTab />}
          {activeTab === "dividends" && <DividendsTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard hover glow>
          <MetricDisplay
            icon={Building2}
            label="Total Properties"
            value={mockInvestments.length}
            iconColor="text-cyan-400"
          />
        </GlassCard>
        <GlassCard hover glow>
          <MetricDisplay
            icon={Users}
            label="Total Investors"
            value={mockMetrics.activeInvestors}
            iconColor="text-blue-400"
            delay={0.1}
          />
        </GlassCard>
        <GlassCard hover glow>
          <MetricDisplay
            icon={DollarSign}
            label="Total Value"
            value={`$${(mockMetrics.totalValueDistributed / 1000000).toFixed(2)}M`}
            iconColor="text-green-400"
            delay={0.2}
          />
        </GlassCard>
        <GlassCard hover glow>
          <MetricDisplay
            icon={TrendingUp}
            label="Avg Return"
            value="5.2%"
            iconColor="text-purple-400"
            delay={0.3}
          />
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard>
        <h3 className="text-xl font-bold mb-4 text-purple-400">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "New property created", property: "Villa Méditerranée", time: "2 hours ago" },
            { action: "Dividends distributed", property: "Résidence Les Jardins", time: "5 hours ago" },
            { action: "Funding completed", property: "Résidence Étudiante", time: "1 day ago" },
            { action: "New investor joined", property: "Immeuble Commerce Lyon", time: "2 days ago" },
          ].map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.property}</p>
              </div>
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function PropertiesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Manage Properties</h3>
        <AnimatedButton variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {mockInvestments.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard hover>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-cyan-400 mb-2">{property.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {property.location.city}, {property.location.province}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-semibold">${property.priceUSD.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-semibold text-green-400">{property.fundingProgress}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Return</p>
                      <p className="font-semibold text-cyan-400">{property.expectedReturn}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold">
                        {property.fundingProgress === 100 ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Active
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Funding
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <AnimatedButton variant="outline" size="sm">
                    Edit
                  </AnimatedButton>
                  <AnimatedButton variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4" />
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CreatePropertyTab() {
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    province: "",
    price: "",
    shares: "",
    pricePerShare: "",
    duration: "",
    expectedReturn: "",
    description: "",
    surface: "",
    rooms: "",
    features: "",
  });

  return (
    <div className="max-w-4xl mx-auto">
      <GlassCard>
        <h3 className="text-2xl font-bold mb-6 text-purple-400">Create New Property</h3>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Property Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Villa Méditerranée"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Province/Region</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Île-de-France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surface (m²)</label>
                <input
                  type="number"
                  value={formData.surface}
                  onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 120"
                />
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total Price (USD)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Shares</label>
                <input
                  type="number"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per Share (USD)</label>
                <input
                  type="number"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData({ ...formData, pricePerShare: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.expectedReturn}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 5.5"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Funding Duration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rooms</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 4"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
              placeholder="Describe the property..."
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium mb-2">Features (comma separated)</label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g., Pool, Garage, Garden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <AnimatedButton variant="outline" className="flex-1">
              Cancel
            </AnimatedButton>
            <AnimatedButton variant="primary" className="flex-1">
              Create Property
            </AnimatedButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function InvestorsTab() {
  const investors = [
    { address: "0x742d...f0bEb", invested: "$245,000", properties: 3, joined: "2024-01-15" },
    { address: "0x8f3C...6A063", invested: "$189,000", properties: 2, joined: "2024-02-20" },
    { address: "0x2791...84174", invested: "$145,000", properties: 2, joined: "2024-03-10" },
    { address: "0x7ceB...9f619", invested: "$98,000", properties: 1, joined: "2024-03-25" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Investor Management</h3>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold">Wallet</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Invested</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Properties</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <code className="text-cyan-400 font-mono">{investor.address}</code>
                  </td>
                  <td className="px-6 py-4 font-semibold">{investor.invested}</td>
                  <td className="px-6 py-4">{investor.properties}</td>
                  <td className="px-6 py-4 text-muted-foreground">{investor.joined}</td>
                  <td className="px-6 py-4">
                    <AnimatedButton variant="outline" size="sm">
                      View Details
                    </AnimatedButton>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function DividendsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Dividend Management</h3>
        <AnimatedButton variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Distribute Dividends
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <MetricDisplay
            icon={DollarSign}
            label="Pending Distribution"
            value="$45,750"
            iconColor="text-yellow-400"
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={CheckCircle2}
            label="Distributed This Month"
            value="$124,500"
            iconColor="text-green-400"
            delay={0.1}
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={TrendingUp}
            label="Total Distributed"
            value="$2.45M"
            iconColor="text-cyan-400"
            delay={0.2}
          />
        </GlassCard>
      </div>

      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">Recent Distributions</h4>
        <div className="space-y-3">
          {[
            { property: "Résidence Les Jardins", amount: "$8,750", date: "2024-11-01", investors: 52 },
            { property: "Immeuble Commerce Lyon", amount: "$12,450", date: "2024-11-01", investors: 38 },
            { property: "Résidence Étudiante", amount: "$15,600", date: "2024-11-01", investors: 45 },
          ].map((dist, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div>
                <p className="font-semibold">{dist.property}</p>
                <p className="text-sm text-muted-foreground">{dist.investors} investors</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-400">{dist.amount}</p>
                <p className="text-sm text-muted-foreground">{dist.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
