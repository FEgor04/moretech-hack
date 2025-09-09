import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
import { useCreateVacancy } from "@/api/mutations/vacancies";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";

export const Route = createFileRoute("/_protectedLayout/vacancies/new")({
	component: RouteComponent,
	loader: async ({ context }) => {
		const vacancies = await context.queryClient.fetchQuery(
			vacanciesQueryOptions(),
		);
		return { vacancies };
	},
});

const VACANCY_STATUSES = ["draft", "published", "closed", "archived"] as const;

const schema = z.object({
	title: z.string().min(1, "Введите название вакансии"),
	description: z.string().optional(),
	status: z.enum(VACANCY_STATUSES).optional(),
	company: z.string().optional(),
	location: z.string().optional(),
	salary_min: z.number().optional(),
	salary_max: z.number().optional(),
	employment_type: z
		.enum(["полная занятость", "частичная занятость", "контракт", "стажировка"])
		.optional(),
	experience_level: z
		.enum(["младший", "средний", "старший", "ведущий"])
		.optional(),
	requirements: z.string().optional(),
	benefits: z.string().optional(),
	skills: z.string().optional(),
	responsibilities: z.string().optional(),
	domain: z.string().optional(),
	education: z.string().optional(),
	minor_skills: z.string().optional(),
	company_info: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function RouteComponent() {
	const navigate = useNavigate();
	const mutation = useCreateVacancy();

	const form = useForm<FormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Zod version compatibility
		resolver: zodResolver(schema as any),
		defaultValues: {
			title: "",
			description: "",
			status: undefined,
			company: "",
			location: "",
			salary_min: undefined,
			salary_max: undefined,
			employment_type: undefined,
			experience_level: undefined,
			requirements: "",
			benefits: "",
			skills: "",
			responsibilities: "",
			domain: "",
			education: "",
			minor_skills: "",
			company_info: "",
		},
	});

	async function onSubmit(values: FormValues) {
		// Преобразуем строки навыков в массивы
		const skillsArray = values.skills
			? values.skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const responsibilitiesArray = values.responsibilities
			? values.responsibilities
					.split(",")
					.map((resp) => resp.trim())
					.filter((resp) => resp.length > 0)
			: undefined;

		const minorSkillsArray = values.minor_skills
			? values.minor_skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const vacancyData = {
			...values,
			skills: skillsArray || [],
			responsibilities: responsibilitiesArray || [],
			minor_skills: minorSkillsArray || [],
		};

		await mutation.mutateAsync(vacancyData);
		navigate({ to: "/vacancies" });
	}

	return (
		<div className="space-y-6 max-w-xl">
			<div className="flex flex-col">
				<h1 className="text-2xl font-bold mb-2">Новая вакансия</h1>
				<p className="text-muted-foreground">Создайте новую вакансию</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid grid-cols-2 gap-4 rounded-md border p-4"
				>
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Название</FormLabel>
								<FormControl>
									<Input placeholder="Frontend Developer" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Описание</FormLabel>
								<FormControl>
									<Textarea placeholder="Описание вакансии..." {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem className="col-span-2">
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
										{VACANCY_STATUSES.map((s) => (
											<SelectItem key={s} value={s}>
												{s === "draft" && "Черновик"}
												{s === "published" && "Опубликована"}
												{s === "closed" && "Закрыта"}
												{s === "archived" && "Архив"}
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
						name="company"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Компания</FormLabel>
								<FormControl>
									<Input placeholder="Название компании" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="location"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Местоположение</FormLabel>
								<FormControl>
									<Input placeholder="Москва, Россия" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="skills"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Требуемые навыки</FormLabel>
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
						name="responsibilities"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Обязанности</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите обязанности через запятую"
										rows={4}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="domain"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Домен/Отрасль</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="IT, Финансы, Медицина и т.д."
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="education"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Требования к образованию</FormLabel>
								<FormControl>
									<Textarea rows={3} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="minor_skills"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Дополнительные навыки</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Введите дополнительные навыки через запятую"
										rows={3}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="company_info"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Информация о компании</FormLabel>
								<FormControl>
									<Textarea rows={4} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="col-span-2 flex gap-2 justify-between">
						<Button asChild variant="outline">
							<Link to="/vacancies">Назад</Link>
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Создание..." : "Создать"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
