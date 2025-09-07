import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreateCandidate } from "@/api/mutations/candidates";
import { candidatesQueryOptions } from "@/api/queries/candidates";

export const Route = createFileRoute("/_protectedLayout/candidates/new")({
	component: RouteComponent,
	loader: async ({ context }) => {
		const candidates = await context.queryClient.fetchQuery(
			candidatesQueryOptions(),
		);
		return { candidates };
	},
});

const CANDIDATE_STATUSES = [
	"pending",
	"reviewing",
	"interviewing",
	"accepted",
	"rejected",
	"on_hold",
] as const;

const schema = z.object({
	name: z.string().min(1, "Введите имя"),
	email: z.string().email("Неверный email"),
	position: z.string().min(1, "Введите должность"),
	experience_years: z.number().int().min(0, "Опыт не может быть отрицательным"),
	status: z.enum(CANDIDATE_STATUSES).optional(),
	skills: z.string().optional(),
	tech: z.string().optional(),
	education: z.string().optional(),
	geo: z.string().optional(),
	employment_type: z.string().optional(),
	experience: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function RouteComponent() {
	const navigate = useNavigate();
	const mutation = useCreateCandidate();

	const form = useForm<FormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Zod version compatibility
		resolver: zodResolver(schema as any),
		defaultValues: {
			name: "",
			email: "",
			position: "",
			experience_years: 0,
			status: undefined,
			skills: "",
			tech: "",
			education: "",
			geo: "",
			employment_type: "",
			experience: "",
		},
	});

	async function onSubmit(values: FormValues) {
		// Преобразуем строки навыков и технологий в массивы
		const skillsArray = values.skills
			? values.skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const techArray = values.tech
			? values.tech
					.split(",")
					.map((tech) => tech.trim())
					.filter((tech) => tech.length > 0)
			: undefined;

		const candidateData = {
			...values,
			skills: skillsArray ? JSON.stringify(skillsArray) : undefined,
			tech: techArray ? JSON.stringify(techArray) : undefined,
		};

		await mutation.mutateAsync(candidateData);
		navigate({ to: "/candidates" });
	}

	return (
		<div className="space-y-6 max-w-xl">
			<div className="flex flex-col">
				<h1 className="text-2xl font-bold mb-2">Новый кандидат</h1>
				<p className="text-muted-foreground">Создайте карточку кандидата</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid grid-cols-2 gap-4 rounded-md border p-4"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Имя</FormLabel>
								<FormControl>
									<Input placeholder="Иван Иванов" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="ivan@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="position"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Должность</FormLabel>
								<FormControl>
									<Input placeholder="Frontend Developer" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="experience_years"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Опыт (лет)</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										step={1}
										{...field}
										onChange={(e) => field.onChange(Number(e.target.value))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Статус</FormLabel>
								<Select
									value={field.value ?? undefined}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Не выбран" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CANDIDATE_STATUSES.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="skills"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Ключевые навыки</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите навыки через запятую (например: Python, React, SQL, Docker)"
										rows={3}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="tech"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Технологии</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите технологии через запятую (например: JavaScript, TypeScript, Node.js, PostgreSQL)"
										rows={3}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="geo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Местоположение</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Москва, Россия"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="employment_type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Тип занятости</FormLabel>
								<Select
									value={field.value ?? undefined}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Не выбран" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="full-time">Полная занятость</SelectItem>
										<SelectItem value="part-time">Частичная занятость</SelectItem>
										<SelectItem value="contract">Контракт</SelectItem>
										<SelectItem value="internship">Стажировка</SelectItem>
										<SelectItem value="remote">Удаленная работа</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="education"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Образование</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите информацию об образовании (JSON формат или текст)"
										rows={4}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="experience"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Детальный опыт работы</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите детальную информацию об опыте работы (JSON формат или текст)"
										rows={6}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="col-span-2 flex gap-2 justify-end">
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Создание..." : "Создать"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
