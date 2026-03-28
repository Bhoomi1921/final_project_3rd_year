import numpy as np
import random

# Fitness function using fuzzy logic
def fuzzy_fitness(threshold, genuine, imposter):
    """
    Higher fitness = better threshold
    """

    # True Accept Rate
    TAR = np.mean(genuine <= threshold)

    # False Accept Rate
    FAR = np.mean(imposter <= threshold)

    # Fuzzy objective (maximize TAR, minimize FAR)
    fitness = (0.7 * TAR) - (0.3 * FAR)
    return fitness


# ================= GA =================
def genetic_algorithm(genuine, imposter,
                      pop_size=30,
                      generations=20,
                      mutation_rate=0.1):

    # initialize population
    population = np.random.uniform(0.2, 0.8, pop_size)

    for _ in range(generations):
        fitness_scores = [fuzzy_fitness(t, genuine, imposter)
                          for t in population]

        # selection (top half)
        sorted_idx = np.argsort(fitness_scores)[::-1]
        population = population[sorted_idx[:pop_size//2]]

        # crossover
        children = []
        while len(children) < pop_size//2:
            p1, p2 = random.sample(list(population), 2)
            child = (p1 + p2) / 2

            # mutation
            if random.random() < mutation_rate:
                child += np.random.normal(0, 0.02)

            child = np.clip(child, 0.2, 0.8)
            children.append(child)

        population = np.concatenate([population, children])

    # best threshold
    best = max(population,
               key=lambda t: fuzzy_fitness(t, genuine, imposter))

    return best
def particle_swarm_optimization(genuine, imposter,
                                n_particles=20,
                                iterations=30):

    particles = np.random.uniform(0.2, 0.8, n_particles)
    velocities = np.zeros(n_particles)

    personal_best = particles.copy()
    global_best = particles[0]

    def fitness(t):
        return fuzzy_fitness(t, genuine, imposter)

    for _ in range(iterations):
        for i in range(n_particles):
            if fitness(particles[i]) > fitness(personal_best[i]):
                personal_best[i] = particles[i]

        global_best = max(personal_best, key=fitness)

        # update velocity & position
        for i in range(n_particles):
            r1, r2 = np.random.rand(), np.random.rand()

            velocities[i] = (
                0.5 * velocities[i]
                + 1.5 * r1 * (personal_best[i] - particles[i])
                + 1.5 * r2 * (global_best - particles[i])
            )

            particles[i] += velocities[i]
            particles[i] = np.clip(particles[i], 0.2, 0.8)

    return global_best