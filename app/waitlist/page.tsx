"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check, TrendingUp, Shield, Zap, Globe, Mail, Loader2 } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";

gsap.registerPlugin(ScrollTrigger);

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple hero fade-in animation (removed heavy animations)
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll(".hero-element"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
        }
      );
    }

    // Simplified features animation (removed 3D rotation)
    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.querySelectorAll(".feature-card"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top center+=150",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // Simplified stats animation (removed heavy counter animation)
    if (statsRef.current) {
      const stats = statsRef.current.querySelectorAll(".stat-number");
      stats.forEach((stat) => {
        const target = parseInt(stat.getAttribute("data-value") || "0");
        gsap.to(stat, {
          innerText: target,
          duration: 1.5,
          snap: { innerText: 1 },
          ease: "power1.out",
          scrollTrigger: {
            trigger: stat,
            start: "top center+=200",
            toggleActions: "play none none none",
            once: true, // Only play once to reduce CPU usage
          },
        });
      });
    }

    // Removed infinite floating animation that was causing performance issues
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // TODO: Send to backend/database
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setEmail("");

      // Reset success message after 5s
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error:", err);
      alert("Error joining waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div ref={heroRef} className="text-center mb-32">
          <motion.div
            className="hero-element inline-block mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                🚀 Coming Soon
              </span>
            </div>
          </motion.div>

          <h1 className="hero-element text-6xl md:text-8xl font-bold mb-6">
            <GradientText animate>
              Investissez dans
              <br />
              l'avenir des actifs
            </GradientText>
          </h1>

          <p className="hero-element text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Tokenisation d'actifs réels sur blockchain. Immobilier, véhicules, entreprises.
            Diversifiez votre portfolio dès <span className="text-cyan-400 font-semibold">1$</span>.
          </p>

          {/* Waitlist Form */}
          <div className="hero-element max-w-md mx-auto">
            <GlassCard className="p-8">
              {success ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Vous êtes sur la liste !</h3>
                  <p className="text-muted-foreground">
                    Nous vous contacterons dès le lancement.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-2xl font-bold mb-2">Rejoignez la Waitlist</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Soyez parmi les premiers à investir
                  </p>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                      disabled={loading}
                    />
                  </div>

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      <>
                        Rejoindre la Waitlist
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </AnimatedButton>

                  <p className="text-xs text-muted-foreground text-center">
                    En vous inscrivant, vous acceptez de recevoir nos communications.
                  </p>
                </form>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Stats Section */}
        <div ref={statsRef} className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Actifs disponibles", value: 500, suffix: "+" },
              { label: "Investisseurs", value: 10000, suffix: "+" },
              { label: "Rendement moyen", value: 8, suffix: "%" },
              { label: "Pays couverts", value: 25, suffix: "+" },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-6 text-center">
                <div className="text-4xl font-bold mb-2">
                  <span className="stat-number text-cyan-400" data-value={stat.value}>
                    0
                  </span>
                  <span className="text-cyan-400">{stat.suffix}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div ref={featuresRef} className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <GradientText>Pourquoi USCI ?</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour investir dans des actifs réels tokenisés
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "100% Sécurisé",
                description: "Smart contracts audités. Vos actifs sont protégés sur la blockchain.",
                color: "from-purple-500 to-pink-600",
              },
              {
                icon: TrendingUp,
                title: "Rendements attractifs",
                description: "Jusqu'à 10% de rendement annuel avec les dividendes automatiques.",
                color: "from-cyan-500 to-blue-600",
              },
              {
                icon: Zap,
                title: "Liquidité instantanée",
                description: "Achetez et vendez vos parts à tout moment sur notre marketplace.",
                color: "from-yellow-500 to-orange-600",
              },
              {
                icon: Globe,
                title: "Multi-actifs",
                description: "Immobilier, véhicules, entreprises, objets de collection et plus.",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Check,
                title: "Accès dès 1$",
                description: "Investissez avec n'importe quel montant. Pas de minimum requis.",
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: ArrowRight,
                title: "Vote & Gouvernance",
                description: "Participez aux décisions importantes via votre NFT share.",
                color: "from-pink-500 to-rose-600",
              },
            ].map((feature, i) => (
              <GlassCard key={i} className="feature-card p-8 hover:scale-105 transition-transform">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <GlassCard className="p-12 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-purple-500/20">
            <h2 className="text-4xl font-bold mb-4">
              <GradientText>Prêt à commencer ?</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'investisseurs qui ont déjà choisi USCI
            </p>
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Rejoindre maintenant
              <ArrowRight className="h-5 w-5 ml-2" />
            </AnimatedButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
