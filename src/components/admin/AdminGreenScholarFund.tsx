'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GreenScholarFundService, type Scholar, type Disbursement } from '@/lib/green-scholar-fund-service'

export default function AdminGreenScholarFund() {
	const [overview, setOverview] = useState<{ totalPetRevenue: number; totalCashDonations: number; totalDisbursed: number; remainingBalance: number }>()
	const [monthly, setMonthly] = useState<Array<{ month: string; pet_revenue: number; donations: number; distributions: number; net_change: number }>>([])
	const [scholars, setScholars] = useState<Scholar[]>([])
	const [disbursements, setDisbursements] = useState<Disbursement[]>([])
	const [filters, setFilters] = useState<{ school?: string; grade?: string; region?: string }>({})
	const [reward, setReward] = useState<{ scholarId: string; amount: string; type: 'points' | 'cash'; purpose: string }>({ scholarId: '', amount: '', type: 'points', purpose: '' })

	useEffect(() => {
		(async () => {
			const [ov, mb, sc, ds] = await Promise.all([
				GreenScholarFundService.getFundOverview(),
				GreenScholarFundService.getMonthlyBreakdown(),
				GreenScholarFundService.listScholars(filters),
				GreenScholarFundService.listDisbursements(),
			])
			setOverview(ov)
			setMonthly(mb)
			setScholars(sc)
			setDisbursements(ds)
		})()
	}, [filters.school, filters.grade, filters.region])

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Green Scholar Fund</h1>
				<p className="text-gray-600">PET revenue and donations for youth education</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{[{
					title: 'Total PET revenue', value: overview?.totalPetRevenue ?? 0
				}, {
					title: 'Cash donations', value: overview?.totalCashDonations ?? 0
				}, {
					title: 'Disbursed', value: overview?.totalDisbursed ?? 0
				}, {
					title: 'Remaining balance', value: overview?.remainingBalance ?? 0
				}].map((c, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-white">{c.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">R{c.value.toFixed(2)}</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Monthly Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Month</TableHead>
								<TableHead>PET</TableHead>
								<TableHead>Donations</TableHead>
								<TableHead>Distributions</TableHead>
								<TableHead>Net</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{monthly.map((m, idx) => (
								<TableRow key={idx}>
									<TableCell>{new Date(m.month).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</TableCell>
									<TableCell>R{m.pet_revenue.toFixed(2)}</TableCell>
									<TableCell>R{m.donations.toFixed(2)}</TableCell>
									<TableCell>R{m.distributions.toFixed(2)}</TableCell>
									<TableCell>R{m.net_change.toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Scholar Registry</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid md:grid-cols-4 gap-2">
							<Input placeholder="Filter by school" onChange={(e) => setFilters(f => ({ ...f, school: e.target.value || undefined }))} />
							<Input placeholder="Filter by grade" onChange={(e) => setFilters(f => ({ ...f, grade: e.target.value || undefined }))} />
							<Input placeholder="Filter by region" onChange={(e) => setFilters(f => ({ ...f, region: e.target.value || undefined }))} />
							<Button variant="outline" onClick={() => setFilters({})}>Clear</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>School</TableHead>
									<TableHead>Grade</TableHead>
									<TableHead>Region</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{scholars.map(s => (
									<TableRow key={s.id}>
										<TableCell className="font-medium">{s.name}</TableCell>
										<TableCell>{s.school || '—'}</TableCell>
										<TableCell>{s.grade || '—'}</TableCell>
										<TableCell>{s.region || '—'}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Disbursements</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Scholar</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Purpose</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{disbursements.map(d => (
									<TableRow key={d.id}>
										<TableCell className="font-medium">{d.scholar_name || d.scholar_id}</TableCell>
										<TableCell>R{d.amount.toFixed(2)}</TableCell>
										<TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
										<TableCell>{d.purpose}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex gap-2">
							<Input placeholder="Scholar ID" onChange={(e) => setReward(r => ({ ...r, scholarId: e.target.value }))} value={reward.scholarId} />
							<Input type="number" placeholder="Amount" onChange={(e) => setReward(r => ({ ...r, amount: e.target.value }))} value={reward.amount} />
							<Input placeholder="Purpose" onChange={(e) => setReward(r => ({ ...r, purpose: e.target.value }))} value={reward.purpose} />
							<Button disabled={!reward.scholarId || !reward.amount} onClick={async () => {
								await GreenScholarFundService.addDisbursement({ scholar_id: reward.scholarId, amount: Number(reward.amount), purpose: reward.purpose })
								setReward({ scholarId: '', amount: '', type: 'points', purpose: '' })
							}}>Add Disbursement</Button>
						</div>

						<div className="flex gap-2 pt-2">
							<Input placeholder="Collection ID for PET processing" id="petCollection" />
							<Button variant="outline" onClick={async () => {
								const input = document.getElementById('petCollection') as HTMLInputElement | null
								const id = input?.value?.trim()
								if (!id) return
								await GreenScholarFundService.processPetContributionForCollection(id)
								// reload
								const [ov, mb, ds] = await Promise.all([
									GreenScholarFundService.getFundOverview(),
									GreenScholarFundService.getMonthlyBreakdown(),
									GreenScholarFundService.listDisbursements(),
								])
								setOverview(ov)
								setMonthly(mb)
								setDisbursements(ds)
							}}>Process PET Contribution</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Reward Distribution</CardTitle>
				</CardHeader>
				<CardContent className="grid md:grid-cols-5 gap-2">
					<Select value={reward.scholarId} onValueChange={(v) => setReward(r => ({ ...r, scholarId: v }))}>
						<SelectTrigger className="w-full"><SelectValue placeholder="Select scholar" /></SelectTrigger>
						<SelectContent>
							{scholars.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
						</SelectContent>
					</Select>
					<Input type="number" placeholder="Amount or points" value={reward.amount} onChange={(e) => setReward(r => ({ ...r, amount: e.target.value }))} />
					<Select value={reward.type} onValueChange={(v) => setReward(r => ({ ...r, type: v as any }))}>
						<SelectTrigger className="w-full"><SelectValue placeholder="Reward type" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="points">Points</SelectItem>
							<SelectItem value="cash">Cash</SelectItem>
						</SelectContent>
					</Select>
					<Input placeholder="Purpose / milestone" value={reward.purpose} onChange={(e) => setReward(r => ({ ...r, purpose: e.target.value }))} />
					<Button disabled={!reward.scholarId || !reward.amount} onClick={async () => {
						await GreenScholarFundService.awardReward({ scholar_id: reward.scholarId, type: reward.type, amount: Number(reward.amount), purpose: reward.purpose })
						setReward({ scholarId: '', amount: '', type: 'points', purpose: '' })
					}}>Assign Reward</Button>
				</CardContent>
			</Card>
		</div>
	)
}


