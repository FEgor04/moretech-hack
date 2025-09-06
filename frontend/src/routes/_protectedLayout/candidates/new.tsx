import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCandidate } from "@/api/mutations/candidates";

export const Route = createFileRoute("/_protectedLayout/candidates/new")({
    component: RouteComponent,
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
    experience: z.coerce.number().int().min(0, "Опыт не может быть отрицательным"),
    status: z.enum(CANDIDATE_STATUSES).optional(),
});

type FormValues = z.infer<typeof schema>;

function RouteComponent() {
    const navigate = useNavigate();
    const mutation = useCreateCandidate();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema as any) as any,
        defaultValues: {
            name: "",
            email: "",
            position: "",
            experience: 0,
            status: undefined,
        },
    });

    async function onSubmit(values: FormValues) {
        await mutation.mutateAsync(values);
        navigate({ to: "/candidates" });
    }

    return (
        <div className="space-y-6 max-w-xl">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold mb-2">Новый кандидат</h1>
                <p className="text-muted-foreground">Создайте карточку кандидата</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 rounded-md border p-4">
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
                                    <Input type="email" placeholder="ivan@example.com" {...field} />
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
                        name="experience"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Опыт (лет)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={0} step={1} {...field} />
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
                                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Не выбран" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CANDIDATE_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
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
