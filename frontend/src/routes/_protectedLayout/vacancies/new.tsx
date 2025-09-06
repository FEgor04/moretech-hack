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
		},
	});

	async function onSubmit(values: FormValues) {
		await mutation.mutateAsync(values);
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
									<Input placeholder="Описание вакансии..." {...field} />
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
